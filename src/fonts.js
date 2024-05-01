
const fontRegex =
  /^\s*(?=(?:(?:[-a-z]+\s*){0,2}(italic|oblique))?)(?=(?:(?:[-a-z]+\s*){0,2}(small-caps))?)(?=(?:(?:[-a-z]+\s*){0,2}(bold(?:er)?|lighter|[1-9]00))?)(?:(?:normal|\1|\2|\3)\s*){0,3}((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\d]+(?:\%|in|[cem]m|ex|p[ctx]))(?:\s*\/\s*(normal|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])))?\s*([-,\'\"\sa-z]+?)\s*$/i;

export const defaultFontData = {
  style: "normal",
  size: 10,
  family: "Helvetica",
  weight: "normal",
};

function parseFontSize(size) {
  if(size.endsWith('px')) {
    size = size.slice(0, -2);
  }
  return parseInt(size);
};

// See 'pdfkit-virtual-files.js' for list of supported fonts.
function getFont(fontFamilyStr, weight, style) {
  const families = fontFamilyStr.split(',').map(s => s.trim());  
  for(const family of families) {
    if(family === 'Courier' || family === 'Helvetica') {
      if(weight === 'bold' && (style === 'oblique' || style === 'italic')) {
        return family + '-BoldOblique';
      } else if(weight === 'bold') {
        return family + '-Bold';
      } else if(style === 'oblique' || style === 'italic') {
        return family + '-Oblique';
      } else {
        return family;
      }
    } else if(family === 'Times') {
      if(weight === 'bold' && (style === 'oblique' || style === 'italic')) {
        return 'Times-BoldItalic';
      } else if(weight === 'bold') {
        return 'Times-Bold';
      } else if(style === 'oblique' || style === 'italic') {
        return 'Times-Italic';
      } else {
        return 'Times-Roman';
      }
    } else if(family === 'Times New Roman') {
      return 'Times-Roman';
    } else if(family === 'Symbol' || family === 'ZapfDingbats') {
      return family;
    } else if(family === 'sans-serif') {
      return 'Helvetica';
    }
  }
  return defaultFontData.family;
}


export function parseFont(font) {
  const fontPart = fontRegex.exec(font);
  if (fontPart === null) {
    return defaultFontData;
  }

  const style  = fontPart[1] || "normal";
  const weight = fontPart[3] || "normal";
  const size   = parseFontSize(fontPart[4]) || 10;
  const family = getFont(fontPart[6], weight, style);

  const data = {
    style,
    size,
    family,
    weight,
  };

  console.log('parseFont', data);
  return data;
};