# Multi-Template Generation

## Upload-Only Templates

The app does not ship with preloaded DOCX templates. Template selection starts
empty, and every template used for generation must be uploaded by the user in
the current browser session.

Uploaded template metadata is represented by:

- `id`: Stable client/server identifier for the uploaded file.
- `name`: Display name for the selection card.
- `description`: Short UI description.
- `fileName`: Original uploaded DOCX file name.
- `originalFilename`: Original uploaded DOCX file name.
- `extension`: Currently `docx`.
- `outputFileName`: Download name for the rendered document.
- `createdAt`: Upload timestamp.
- `size`: Uploaded file size.
- `file`: Browser `File` object, kept in session memory on the client.

## Generation Payload

The app submits selected uploaded template IDs as a JSON string in the multipart
`selectedTemplateIds` field. It also includes:

- `uploadedTemplateMetadata`: JSON metadata for selected uploaded templates.
- `uploadedTemplateFile:<templateId>`: The actual DOCX file for each selected
  uploaded template.

The API rejects unknown template IDs and never falls back to a default template.

## Output File Names

When one uploaded template is selected, the API returns the rendered `.docx`
directly using that template's `outputFileName`.

When multiple uploaded templates are selected, the API returns
`generated-documents.zip`. Each generated `.docx` inside the archive uses its
configured `outputFileName`.

## Single vs Multiple Download Behavior

- One selected template: browser downloads one `.docx`.
- Multiple selected templates: browser downloads one `.zip` containing all
  generated `.docx` files.

## Security Notes

- Uploaded template IDs must match the expected uploaded-template ID pattern.
- Uploaded template filenames must be plain `.docx` filenames.
- Uploaded templates are limited to DOCX uploads under 10 MB.
- Uploaded template files are validated for MIME type, size, and ZIP magic.
- Uploaded template files are kept in memory for the current browser session.
- Uploaded images are validated and kept in memory only.
- Generated document XML is validated before the API responds.
