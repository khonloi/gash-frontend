import { useEffect } from "react";

/**
 * Custom hook to dynamically set document title and meta description.
 * @param {string} title - Page title to set
 * @param {string} [description] - Optional meta description
 */
export default function useDocumentTitle(title, description) {
  useEffect(() => {
    const baseTitle = "GASH";
    const fullTitle = title ? `${title} | ${baseTitle}` : `${baseTitle} — Global Fits, Zero Limits`;
    document.title = fullTitle;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", description);
      }
    }
  }, [title, description]);
}
