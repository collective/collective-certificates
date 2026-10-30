import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';

/** A file widget value before the item is saved. */
export interface UploadedImage {
  data: string;
  encoding: string;
  'content-type': string;
  filename?: string;
}

/** An image field as plone.restapi serializes it. */
export interface StoredImage {
  download: string;
  width?: number;
  height?: number;
  'content-type'?: string;
  filename?: string;
}

export type ImageValue = UploadedImage | StoredImage | null | undefined;

/** Where to draw an image from, and its size when known. */
export interface ImageSource {
  url: string;
  width?: number;
  height?: number;
}

const isUploaded = (value: object): value is UploadedImage =>
  'data' in value && typeof value.data === 'string';

const isStored = (value: object): value is StoredImage =>
  'download' in value && typeof value.download === 'string';

/**
 * Turn either shape of an image field value into something to draw.
 *
 * Before saving, the widget holds base64 data, drawn as a data URL with no
 * size (read it from the loaded image); after saving, the serializer gives
 * a download URL and the pixel size.
 *
 * @returns The source, or `null` for an empty field.
 */
export function imageSource(value: ImageValue): ImageSource | null {
  if (!value || typeof value !== 'object') return null;
  if (isUploaded(value)) {
    const encoding = value.encoding || 'base64';
    return {
      url: `data:${value['content-type']};${encoding},${value.data}`,
    };
  }
  if (isStored(value)) {
    return {
      url: flattenToAppURL(value.download),
      ...(value.width ? { width: value.width } : {}),
      ...(value.height ? { height: value.height } : {}),
    };
  }
  return null;
}

/** An Image item inside a template, as an image element can show it. */
export interface TemplateImage {
  /** The item id, which is the element's `asset`. */
  id: string;
  title: string;
  /** The item's address in the app. */
  href: string;
  /** The full image. */
  url: string;
}

/** An item as plone.restapi summarizes a container's contents. */
export interface ContentItem {
  '@id': string;
  '@type': string;
  id?: string;
  title?: string;
}

/**
 * The Image items among a template's contents, in their order.
 *
 * @param items The `items` of the serialized template.
 * @returns Each image with its id, title, address and full image URL.
 */
export function templateImages(
  items: readonly ContentItem[] | null | undefined,
): TemplateImage[] {
  return (items ?? [])
    .filter((item) => item['@type'] === 'Image')
    .map((item) => {
      const url = flattenToAppURL(item['@id']);
      const id = item.id || url.split('/').pop() || '';
      return {
        id,
        title: item.title || id,
        href: url,
        url: `${url}/@@images/image`,
      };
    });
}

/**
 * Read an image's natural size by loading it.
 *
 * @returns `[width, height]`, rejecting when the image cannot load.
 */
export function naturalSize(url: string): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
    image.onerror = () => reject(new Error(`Cannot load image: ${url}`));
    image.src = url;
  });
}
