export type DocumentTemplate = {
  createdAt: string;
  extension: "docx";
  file?: File;
  fileName: string;
  id: string;
  name: string;
  originalFilename: string;
  outputFileName: string;
  size: number;
};

export const DOCX_TEMPLATE_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const DOCX_TEMPLATE_ACCEPT = `.docx,${DOCX_TEMPLATE_CONTENT_TYPE}`;

export const MAX_UPLOADED_TEMPLATE_BYTES = 10 * 1024 * 1024;

export const UPLOADED_TEMPLATE_ID_PREFIX = "uploaded-template-";

export const UPLOADED_TEMPLATE_METADATA_FIELD = "uploadedTemplateMetadata";

export function getUploadedTemplateFileFieldName(templateId: string) {
  return `uploadedTemplateFile:${templateId}`;
}

export function getTemplatesByIds(
  templateIds: readonly string[],
  templates: readonly DocumentTemplate[],
) {
  return templateIds
    .map((templateId) =>
      templates.find((template) => template.id === templateId),
    )
    .filter((template): template is DocumentTemplate => Boolean(template));
}
