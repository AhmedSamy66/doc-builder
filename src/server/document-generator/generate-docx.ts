import "server-only";

import {
  DOMParser,
  XMLSerializer,
  type CharacterData as XmlCharacterData,
  type Document as XmlDocument,
  type Element as XmlElement,
  type Node as XmlNode,
} from "@xmldom/xmldom";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import PizZip from "pizzip";
import {
  DEFAULT_IMAGE_WIDTH_CM,
} from "@/src/features/document-generator/types/document-schema";
import type {
  TextReplacementPayload,
} from "@/src/features/document-generator/types/document-schema";
import {
  getImageExtension,
  getImageNaturalDimensions,
} from "@/src/server/document-generator/image-utils";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;
const IMAGE_PLACEHOLDER_MODULE =
  "open-xml-templating/docxtemplater-image-module";
const IMAGE_TOKEN_START_DELIMITER = "%%DOCX_IMAGE_START%%";
const IMAGE_TOKEN_END_DELIMITER = "%%DOCX_IMAGE_END%%";
const CM_TO_IMAGE_PIXELS = 96 / 2.54;
const DEFAULT_IMAGE_ASPECT_RATIO = 1;

const IMAGE_NAMESPACE_ATTRIBUTES = {
  "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  "xmlns:wp":
    "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
} as const;

const WORD_XML_FILES_THAT_CAN_CONTAIN_REPLACEMENTS =
  /^word\/(?:document|header\d+|footer\d+)\.xml$/;

export class InvalidTemplateArchiveError extends Error {
  constructor(readonly details: string[]) {
    super("Template file is not a valid .docx archive.");
    this.name = "InvalidTemplateArchiveError";
  }
}

export class DocumentRenderError extends Error {
  constructor(readonly details: string[]) {
    super("Template render failed.");
    this.name = "DocumentRenderError";
  }
}

export type GenerateDocxImageReplacement = {
  buffer: Buffer;
  fieldId: string;
  label: string;
  naturalHeight?: number;
  naturalWidth?: number;
  replacementTarget: string;
  widthCm?: number;
};

export type GenerateDocxData = {
  imageReplacements: GenerateDocxImageReplacement[];
  textReplacements: TextReplacementPayload[];
};

type ImageModuleWithNaming = ImageModule & {
  imageNumber: number;
  getNextImageName: () => string;
};

type ImageRenderData = {
  buffer: Buffer;
  label: string;
  naturalHeight?: number;
  naturalWidth?: number;
  widthCm?: number;
};

type ReplacementOperation = {
  label: string;
  target: string;
  value: string;
};

type TextSegment = {
  end: number;
  node: XmlCharacterData;
  start: number;
  text: string;
};

type TextPosition = {
  offset: number;
  segmentIndex: number;
};

function debugDocx(message: string, context?: Record<string, unknown>) {
  if (process.env.DOCX_DEBUG !== "true") {
    return;
  }

  console.log(`[docx-generator] ${message}`, context ?? "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function getDocxtemplaterMessages(error: unknown): string[] {
  if (!isRecord(error)) {
    return ["Unknown template rendering error"];
  }

  const properties = isRecord(error.properties) ? error.properties : undefined;
  const nestedErrors = Array.isArray(properties?.errors)
    ? properties.errors
    : [];

  if (nestedErrors.length > 0) {
    return nestedErrors.map((nestedError) => {
      const nestedRecord = isRecord(nestedError) ? nestedError : undefined;
      const nestedProperties =
        nestedRecord && isRecord(nestedRecord.properties)
          ? nestedRecord.properties
          : undefined;

      if (typeof nestedProperties?.explanation === "string") {
        return nestedProperties.explanation;
      }

      return getErrorMessage(nestedError);
    });
  }

  if (typeof properties?.explanation === "string") {
    return [properties.explanation];
  }

  return [getErrorMessage(error)];
}

function parseXml(xml: string, fileName: string) {
  const parserMessages: string[] = [];

  try {
    const document = new DOMParser({
      onError(level, message) {
        parserMessages.push(`${level}: ${message}`);
      },
    }).parseFromString(xml, "application/xml");

    if (parserMessages.length > 0) {
      throw new Error(parserMessages.join("; "));
    }

    return document;
  } catch (error) {
    throw new Error(`${fileName}: ${getErrorMessage(error)}`);
  }
}

function ensureImageNamespaces(zip: PizZip) {
  const serializer = new XMLSerializer();

  for (const file of zip.file(/\.xml$/)) {
    if (
      file.dir ||
      !WORD_XML_FILES_THAT_CAN_CONTAIN_REPLACEMENTS.test(file.name)
    ) {
      continue;
    }

    const document = parseXml(file.asText(), file.name);
    const root = document.documentElement;
    let changed = false;

    if (!root) {
      throw new Error(`${file.name}: XML document has no root element.`);
    }

    for (const [attributeName, attributeValue] of Object.entries(
      IMAGE_NAMESPACE_ATTRIBUTES,
    )) {
      if (!root.getAttribute(attributeName)) {
        root.setAttribute(attributeName, attributeValue);
        changed = true;
      }
    }

    if (changed) {
      zip.file(file.name, serializer.serializeToString(document));
    }
  }
}

function assertRenderedXmlIsValid(zip: PizZip) {
  for (const file of zip.file(/\.xml$/)) {
    if (file.dir) {
      continue;
    }

    parseXml(file.asText(), file.name);
  }
}

function isElementNode(node: XmlNode): node is XmlElement {
  return node.nodeType === ELEMENT_NODE;
}

function isCharacterDataNode(node: XmlNode): node is XmlCharacterData {
  return node.nodeType === TEXT_NODE || node.nodeType === CDATA_SECTION_NODE;
}

function isWordParagraphElement(node: XmlNode) {
  return isElementNode(node) && node.nodeName === "w:p";
}

function isWordTextElement(node: XmlNode) {
  return isElementNode(node) && node.nodeName === "w:t";
}

function getChildNodes(node: XmlNode) {
  const childNodes: XmlNode[] = [];

  for (let index = 0; index < node.childNodes.length; index += 1) {
    const childNode = node.childNodes.item(index);

    if (childNode) {
      childNodes.push(childNode);
    }
  }

  return childNodes;
}

function collectTextNodesFromElement(
  node: XmlNode,
  textNodes: XmlCharacterData[],
) {
  if (isWordTextElement(node)) {
    for (const childNode of getChildNodes(node)) {
      if (isCharacterDataNode(childNode)) {
        textNodes.push(childNode);
      }
    }

    return;
  }

  for (const childNode of getChildNodes(node)) {
    collectTextNodesFromElement(childNode, textNodes);
  }
}

function collectParagraphTextNodeGroups(document: XmlDocument) {
  const groups: XmlCharacterData[][] = [];

  function visit(node: XmlNode) {
    if (isWordParagraphElement(node)) {
      const textNodes: XmlCharacterData[] = [];

      collectTextNodesFromElement(node, textNodes);

      if (textNodes.length > 0) {
        groups.push(textNodes);
      }

      return;
    }

    for (const childNode of getChildNodes(node)) {
      visit(childNode);
    }
  }

  if (document.documentElement) {
    visit(document.documentElement);
  }

  if (groups.length === 0 && document.documentElement) {
    const textNodes: XmlCharacterData[] = [];

    collectTextNodesFromElement(document.documentElement, textNodes);

    if (textNodes.length > 0) {
      groups.push(textNodes);
    }
  }

  return groups;
}

function getTextSegments(textNodes: readonly XmlCharacterData[]) {
  const segments: TextSegment[] = [];
  let offset = 0;

  for (const node of textNodes) {
    const text = node.data;
    const start = offset;
    const end = start + text.length;

    offset = end;

    if (text.length === 0) {
      continue;
    }

    segments.push({
      end,
      node,
      start,
      text,
    });
  }

  return segments;
}

function getFullText(segments: readonly TextSegment[]) {
  return segments.map((segment) => segment.text).join("");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMatchOffsets(text: string, target: string) {
  const offsets: number[] = [];
  const targetPattern = new RegExp(escapeRegExp(target), "gi");
  let match = targetPattern.exec(text);

  while (match) {
    offsets.push(match.index);
    match = targetPattern.exec(text);
  }

  return offsets;
}

function findTextPosition(
  segments: readonly TextSegment[],
  offset: number,
  bias: "end" | "start",
): TextPosition {
  if (segments.length === 0) {
    throw new Error("Cannot replace text in an empty paragraph.");
  }

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];

    if (offset > segment.start && offset < segment.end) {
      return {
        offset: offset - segment.start,
        segmentIndex: index,
      };
    }

    if (offset === segment.start && bias === "start") {
      return {
        offset: 0,
        segmentIndex: index,
      };
    }

    if (offset === segment.end && bias === "end") {
      return {
        offset: segment.text.length,
        segmentIndex: index,
      };
    }
  }

  if (offset <= 0) {
    return {
      offset: 0,
      segmentIndex: 0,
    };
  }

  const lastSegmentIndex = segments.length - 1;
  const lastSegment = segments[lastSegmentIndex];

  return {
    offset: lastSegment.text.length,
    segmentIndex: lastSegmentIndex,
  };
}

function applySingleReplacement(
  textNodes: readonly XmlCharacterData[],
  matchOffset: number,
  targetLength: number,
  value: string,
) {
  const segments = getTextSegments(textNodes);
  const startPosition = findTextPosition(segments, matchOffset, "start");
  const endPosition = findTextPosition(
    segments,
    matchOffset + targetLength,
    "end",
  );
  const startSegment = segments[startPosition.segmentIndex];
  const endSegment = segments[endPosition.segmentIndex];

  if (startPosition.segmentIndex === endPosition.segmentIndex) {
    startSegment.node.data =
      startSegment.text.slice(0, startPosition.offset) +
      value +
      startSegment.text.slice(endPosition.offset);
    return;
  }

  startSegment.node.data =
    startSegment.text.slice(0, startPosition.offset) + value;

  for (
    let index = startPosition.segmentIndex + 1;
    index < endPosition.segmentIndex;
    index += 1
  ) {
    segments[index].node.data = "";
  }

  endSegment.node.data = endSegment.text.slice(endPosition.offset);
}

function replaceTargetInTextNodeGroup(
  textNodes: readonly XmlCharacterData[],
  target: string,
  value: string,
) {
  if (!target) {
    return 0;
  }

  const fullText = getFullText(getTextSegments(textNodes));
  const matchOffsets = getMatchOffsets(fullText, target);

  for (const matchOffset of matchOffsets.slice().reverse()) {
    applySingleReplacement(textNodes, matchOffset, target.length, value);
  }

  return matchOffsets.length;
}

function replaceTargetsInXml(
  xml: string,
  replacements: readonly ReplacementOperation[],
  fileName: string,
) {
  const document = parseXml(xml, fileName);
  const textNodeGroups = collectParagraphTextNodeGroups(document);
  const replacementCounts = new Map<string, number>();
  let totalReplacementCount = 0;

  for (const replacement of replacements) {
    let replacementCount = 0;

    for (const textNodeGroup of textNodeGroups) {
      replacementCount += replaceTargetInTextNodeGroup(
        textNodeGroup,
        replacement.target,
        replacement.value,
      );
    }

    replacementCounts.set(replacement.target, replacementCount);
    totalReplacementCount += replacementCount;
  }

  return {
    replacementCounts,
    xml:
      totalReplacementCount > 0
        ? new XMLSerializer().serializeToString(document)
        : xml,
  };
}

function applyTargetReplacements(
  zip: PizZip,
  replacements: readonly ReplacementOperation[],
) {
  const sortedReplacements = replacements
    .filter((replacement) => replacement.target.length > 0)
    .slice()
    .sort((first, second) => second.target.length - first.target.length);

  if (sortedReplacements.length === 0) {
    return;
  }

  const countsByTarget = new Map<string, number>();

  for (const file of zip.file(/\.xml$/)) {
    if (
      file.dir ||
      !WORD_XML_FILES_THAT_CAN_CONTAIN_REPLACEMENTS.test(file.name)
    ) {
      continue;
    }

    const { replacementCounts, xml } = replaceTargetsInXml(
      file.asText(),
      sortedReplacements,
      file.name,
    );

    zip.file(file.name, xml);

    for (const [target, count] of replacementCounts.entries()) {
      countsByTarget.set(target, (countsByTarget.get(target) ?? 0) + count);
    }
  }

  debugDocx("replacement counts", Object.fromEntries(countsByTarget));
}

function assertImageBuffer(buffer: Buffer | undefined, label: string) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error(`${label} image must be a non-empty Buffer.`);
  }
}

function cmToImagePixels(value: number) {
  return Math.max(1, Math.round(value * CM_TO_IMAGE_PIXELS));
}

function readPositiveNumber(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function getImageAspectRatio(imageData: ImageRenderData) {
  const naturalWidth = readPositiveNumber(imageData.naturalWidth);
  const naturalHeight = readPositiveNumber(imageData.naturalHeight);

  if (!naturalWidth || !naturalHeight) {
    return DEFAULT_IMAGE_ASPECT_RATIO;
  }

  return naturalWidth / naturalHeight;
}

function getImageSize(imageData: ImageRenderData): [number, number] {
  const widthCm = readPositiveNumber(imageData.widthCm) ?? DEFAULT_IMAGE_WIDTH_CM;
  const heightCm = widthCm / getImageAspectRatio(imageData);

  return [cmToImagePixels(widthCm), cmToImagePixels(heightCm)];
}

function createImageModule(imageDataByToken: Map<string, ImageRenderData>) {
  const imageExtensions: string[] = [];

  const imageModule = new ImageModule({
    centered: true,
    getImage(_tagValue, tagName) {
      const imageData = imageDataByToken.get(String(tagName));

      if (!imageData) {
        throw new Error(`Missing image data for ${String(tagName)}.`);
      }

      assertImageBuffer(imageData.buffer, imageData.label);
      imageExtensions.push(getImageExtension(imageData.buffer));

      return imageData.buffer;
    },
    getSize(_image, _tagValue, tagName) {
      const imageData = imageDataByToken.get(String(tagName));

      if (!imageData) {
        throw new Error(`Missing image size for ${String(tagName)}.`);
      }

      return getImageSize(imageData);
    },
    setParser(placeholder) {
      if (!imageDataByToken.has(placeholder)) {
        return null;
      }

      return {
        centered: true,
        module: IMAGE_PLACEHOLDER_MODULE,
        type: "placeholder",
        value: placeholder,
      };
    },
  }) as ImageModuleWithNaming;

  imageModule.getNextImageName = function getNextImageName() {
    const extension = imageExtensions.shift() ?? "png";
    const name = `image_generated_${this.imageNumber}.${extension}`;
    this.imageNumber += 1;
    return name;
  };

  return imageModule;
}

function createImageToken(fieldId: string, index: number) {
  const fieldToken = fieldId.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40);

  return `image_${index}_${fieldToken || "field"}`;
}

function formatTwoDigitDatePart(value: string) {
  return value.padStart(2, "0");
}

function isValidDateParts(day: string, month: string, year: string) {
  const dayValue = Number(day);
  const monthValue = Number(month);
  const yearValue = Number(year);

  return (
    Number.isInteger(dayValue) &&
    dayValue >= 1 &&
    dayValue <= 31 &&
    Number.isInteger(monthValue) &&
    monthValue >= 1 &&
    monthValue <= 12 &&
    Number.isInteger(yearValue) &&
    year.length === 4
  );
}

function formatDateReplacementValue(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return value;
  }

  const yearMonthDayMatch = trimmedValue.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
  );

  if (yearMonthDayMatch) {
    const [, year, month, day] = yearMonthDayMatch;

    if (isValidDateParts(day, month, year)) {
      return `${formatTwoDigitDatePart(day)}/${formatTwoDigitDatePart(
        month,
      )}/${year}`;
    }
  }

  const monthDayYearMatch = trimmedValue.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,
  );

  if (monthDayYearMatch) {
    const [, month, day, year] = monthDayYearMatch;

    if (isValidDateParts(day, month, year)) {
      return `${formatTwoDigitDatePart(day)}/${formatTwoDigitDatePart(
        month,
      )}/${year}`;
    }
  }

  return value;
}

function formatTextReplacementValue(replacement: TextReplacementPayload) {
  return replacement.type === "date"
    ? formatDateReplacementValue(replacement.value)
    : replacement.value;
}

function hasReplacementValue(value: string) {
  return value.trim().length > 0;
}

function buildRenderContext(data: GenerateDocxData) {
  const replacements: ReplacementOperation[] = data.textReplacements
    .map((replacement): ReplacementOperation | undefined => {
      const value = formatTextReplacementValue(replacement);

      if (!hasReplacementValue(value)) {
        return undefined;
      }

      return {
        label: replacement.label,
        target: replacement.replacementTarget,
        value,
      };
    })
    .filter(
      (replacement): replacement is ReplacementOperation =>
        replacement !== undefined,
    );
  const imageDataByToken = new Map<string, ImageRenderData>();
  const renderData: Record<string, string> = {};

  data.imageReplacements.forEach((replacement, index) => {
    assertImageBuffer(replacement.buffer, replacement.label);

    const token = createImageToken(replacement.fieldId, index);
    const imageNaturalDimensions = getImageNaturalDimensions(replacement.buffer);

    imageDataByToken.set(token, {
      buffer: replacement.buffer,
      label: replacement.label,
      naturalHeight:
        readPositiveNumber(replacement.naturalHeight) ??
        imageNaturalDimensions?.naturalHeight,
      naturalWidth:
        readPositiveNumber(replacement.naturalWidth) ??
        imageNaturalDimensions?.naturalWidth,
      widthCm: replacement.widthCm,
    });
    renderData[token] = token;
    replacements.push({
      label: replacement.label,
      target: replacement.replacementTarget,
      value: `${IMAGE_TOKEN_START_DELIMITER}${token}${IMAGE_TOKEN_END_DELIMITER}`,
    });
  });

  debugDocx("render input", {
    imageReplacementCount: data.imageReplacements.length,
    textReplacementCount: data.textReplacements.length,
  });

  return {
    imageDataByToken,
    renderData,
    replacements,
  };
}

export async function generateDocx(
  data: GenerateDocxData,
  options: { templateBuffer: Buffer },
): Promise<Buffer> {
  const { templateBuffer } = options;

  let zip: PizZip;

  try {
    zip = new PizZip(templateBuffer);
    ensureImageNamespaces(zip);
  } catch (error) {
    throw new InvalidTemplateArchiveError([getErrorMessage(error)]);
  }

  try {
    const { imageDataByToken, renderData, replacements } =
      buildRenderContext(data);

    applyTargetReplacements(zip, replacements);

    if (imageDataByToken.size > 0) {
      const imageModule = createImageModule(imageDataByToken);
      const document = new Docxtemplater(zip, {
        delimiters: {
          end: IMAGE_TOKEN_END_DELIMITER,
          start: IMAGE_TOKEN_START_DELIMITER,
        },
        linebreaks: true,
        modules: [imageModule],
        paragraphLoop: true,
      });

      try {
        document.render(renderData);
      } catch (error) {
        console.error("Docx rendering failed:", error);
        throw error;
      }

      zip = document.getZip();
    }

    assertRenderedXmlIsValid(zip);

    return zip.generate({
      compression: "DEFLATE",
      type: "nodebuffer",
    });
  } catch (error) {
    throw new DocumentRenderError(getDocxtemplaterMessages(error));
  }
}
