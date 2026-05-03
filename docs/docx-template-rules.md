# DOCX Template Rules

## Overview

Word `.docx` files are ZIP containers. Inside the ZIP are XML files,
relationship files, media assets, styles, and document metadata.

A generated document can be ZIP-valid but XML-invalid. In that case, unzip
tools may open the file successfully, but Microsoft Word can still reject it
because one of the internal XML parts is malformed.

## Replacement Target Rules

The app does not auto-detect placeholders and does not require a placeholder
syntax. Users manually define the replacement target that exists in their
uploaded DOCX template. Replacement is case-insensitive, but the target text
structure is still literal.

Valid replacement targets can look like:

```text
{clientName}
{{CLIENT_NAME}}
[Client Name]
CLIENT_NAME
```

Avoid splitting replacement targets across styled runs. For example, do not
bold only `{client` and leave `Name}` unstyled. Prefer typing targets directly
in Word and applying formatting to the whole target.

## Image Target Rules

Image replacement targets should be alone in their own paragraph.

Do not put image targets inline with labels or other text. The image pipeline
replaces the target with Word drawing XML, and inline placement can produce
invalid or hard-to-maintain document XML.

Recommended template layout:

```text
Signature:

{signature}

Company Stamp:

{stamp}
```

Avoid this:

```text
Signature: {signature}
Company Stamp: {stamp}
```

## Image Handling Rules In Code

The app converts dynamic image replacement targets into internal render tokens
before using `docxtemplater-image-module-free`.

`getImage()` must always return a real non-empty `Buffer`. It must never return
a file path string, `undefined`, or `null`.

`getSize()` must always return an array of two valid positive numbers:

```ts
[width, height]
```

The configured image width, or the default width when omitted, is converted to
image pixels during rendering. Height is calculated from the uploaded image's
natural aspect ratio so generated images are not stretched.

## Namespace Rules

Templates with image replacement targets must include the required Word drawing
namespaces in XML parts that can receive images, especially
`word/document.xml`.

Required namespaces include:

```xml
xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
```

If `wp` is missing, the app adds the required namespaces before image rendering.
When possible, create and save templates using Microsoft Word.

## Validation Rules

The field schema controls validation:

- Field Label is required.
- Replacement Target is required.
- Replacement Target must be unique across text and image fields.
- Required text fields must have values before generation.
- Required image fields must have uploaded files before generation.
- Uploaded images must match accepted PNG/JPEG MIME types and max size.
- Uploaded DOCX templates must be selected before generation.

After rendering, generated XML parts are validated before returning the file.
This catches malformed XML, missing namespaces, and broken document parts before
a corrupted `.docx` reaches the browser.

## Common Failure Symptoms

- Word shows: `Word experienced an error trying to open the file`.
- Replacement targets remain in `word/document.xml`.
- Image files are missing under `word/media`.
- Relationship files do not reference generated images.
- `[Content_Types].xml` does not include the generated image extension.
- XML parsing fails for `word/document.xml` or related Word XML parts.

## Debugging Checklist

- Does the replacement target have the same literal structure as the uploaded
  DOCX target?
- Is the image target alone in its own paragraph?
- Is the uploaded image `Buffer` non-empty?
- Does `getImage()` return a `Buffer`?
- Does `getSize()` return two valid positive numbers?
- Does `word/document.xml` contain `xmlns:wp`?
- Are generated XML parts valid?
- Are there leftover replacement targets after rendering?
- Do generated image files exist under `word/media`?
- Do relationship files point to the generated media files?

## Future Maintenance Notes

Keep this file updated whenever template or replacement logic changes.

When adding new replacement behavior, test both the successful generation path
and at least one validation failure path.
