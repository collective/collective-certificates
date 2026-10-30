import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { templateImages } from '../helpers/image';
import type { ContentItem, TemplateImage } from '../helpers/image';

interface ContentState {
  content?: { data?: { '@id'?: string; items?: ContentItem[] } | null };
}

const NONE: TemplateImage[] = [];

/**
 * The Image items inside a saved template, read from the content Volto
 * has loaded for it.
 *
 * @param templateUrl The template's URL; `null` while it is being added.
 * @returns The images, or none when the loaded content is another item.
 */
export default function useTemplateImages(
  templateUrl: string | null,
): TemplateImage[] {
  const content = useSelector((state: ContentState) => state.content?.data);
  return useMemo(() => {
    const loaded = content?.['@id'];
    if (!templateUrl || !loaded) return NONE;
    if (flattenToAppURL(loaded) !== flattenToAppURL(templateUrl)) return NONE;
    return templateImages(content.items);
  }, [content, templateUrl]);
}
