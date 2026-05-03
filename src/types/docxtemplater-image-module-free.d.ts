declare module "docxtemplater-image-module-free" {
  type ImageModulePlaceholder = {
    centered?: boolean;
    module: string;
    type: "placeholder";
    value: string;
  };

  type ImageModuleOptions = {
    centered?: boolean;
    fileType?: "docx" | "pptx";
    getImage: (tagValue: unknown, tagName: string) => Buffer;
    getSize: (
      image: Buffer,
      tagValue: unknown,
      tagName: string,
    ) => [number, number];
    setParser?: (placeholder: string) => ImageModulePlaceholder | null;
  };

  class ImageModule {
    imageNumber: number;

    constructor(options: ImageModuleOptions);

    getNextImageName(): string;
  }

  export = ImageModule;
}
