import productsRaw from './data/gash_products.json';
import categoriesRaw from './data/gash_categories.json';
import variantsRaw from './data/gash_Productvariants.json';
import imagesRaw from './data/gash_productimages.json';
import colorsRaw from './data/gash_productcolors.json';
import sizesRaw from './data/gash_productsizes.json';

// Helper to normalize MongoDB $oid to string
const getID = (obj) => {
  if (!obj) return null;
  return obj.$oid || obj;
};

// Maps for quick lookup by ID string
export const mockCategories = categoriesRaw.map(c => ({ ...c, _id: getID(c._id) }));
export const mockColors = colorsRaw.map(c => ({ ...c, _id: getID(c._id) }));
export const mockSizes = sizesRaw.map(s => ({ ...s, _id: getID(s._id) }));

const categoriesMap = Object.fromEntries(mockCategories.map(c => [c._id, c]));
const colorsMap = Object.fromEntries(mockColors.map(c => [c._id, c]));
const sizesMap = Object.fromEntries(mockSizes.map(s => [s._id, s]));
const imagesMap = Object.fromEntries(imagesRaw.map(i => [getID(i._id), { ...i, _id: getID(i._id) }]));

// Pre-process variants to include color/size objects
const variantsMap = Object.fromEntries(variantsRaw.map(v => {
  const id = getID(v._id);
  return [id, {
    ...v,
    _id: id,
    productColorId: colorsMap[getID(v.productColorId)],
    productSizeId: sizesMap[getID(v.productSizeId)]
  }];
}));

export const mockUser = {
  _id: "john-doe-123",
  username: "tommy86",
    name: "Thomas Vercetti",
  email: "thomas.vercetti@email.com",
  phone: "0123456789",
  address: "1102nd Washington Street, Washington Beach, Vice City, Florida",
  role: "customer",
  image: "https://static.wikia.nocookie.net/gtawiki/images/a/ae/TommyVercetti-GTAVC.jpg",
  gender: "male",
  dob: "1951-08-28",
  createdAt: new Date().toISOString()
};


export const mockProducts = productsRaw.map(p => {
  const pId = getID(p._id);
  return {
    ...p,
    _id: pId,
    name: p.productName, // Aliased for components expecting .name
    categoryId: categoriesMap[getID(p.categoryId)],
    // In actual app, products often come with populated images and variants
    productImageIds: (p.productImageIds || []).map(id => imagesMap[getID(id)]).filter(Boolean),
    productVariantIds: (p.productVariantIds || []).map(id => variantsMap[getID(id)]).filter(Boolean),
    createdAt: p.createdAt?.$date || p.createdAt
  };
});

export const mockVariants = Object.values(variantsMap);
