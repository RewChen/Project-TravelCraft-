// ============================================================
// ไฟล์กลางสำหรับเก็บรูป Template (Map Editor)
// วิธีใส่รูปเพิ่ม:
//  1. เอาไฟล์รูปไปวางใน public/templates/ เช่น public/templates/map6.jpg
//  2. เพิ่ม 1 object ใน mapTemplates ด้านล่าง (ดูตัวอย่างกลุ่ม gametion)
//  3. ไม่ต้องแก้ไฟล์อื่น — MapEditor.jsx จะดึงจากไฟล์นี้อัตโนมัติ
// ============================================================

// ใช้ BASE_URL ของ Vite แทน path ตายตัว '/templates' เพื่อให้รูปยังโหลดได้
// แม้ deploy ใต้ subpath (เช่น GitHub Pages) — dev (BASE_URL='/') ได้ '/templates' เหมือนเดิม
const BASE = import.meta.env.BASE_URL || '/';
export const TEMPLATE_IMAGE_BASE = `${BASE}templates`;

// รวม path รูปทั้งหมดไว้ที่เดียว เอาไว้ใส่รูปใน template
export const templateImages = {
  map1: `${TEMPLATE_IMAGE_BASE}/map1.png`,
  map2: `${TEMPLATE_IMAGE_BASE}/map2.jpg`,
  map3: `${TEMPLATE_IMAGE_BASE}/map3.jpg`,
  map4: `${TEMPLATE_IMAGE_BASE}/map4.jpg`,
  map5: `${TEMPLATE_IMAGE_BASE}/map5.jpg`,
  // ตัวอย่างการเพิ่มรูปใหม่:
  // map6: `${TEMPLATE_IMAGE_BASE}/map6.jpg`,
};

export const mapTemplates = [
  {
    id: 'blank',
    labelKey: 'editor.templateBlank',
    preview: '#ffffff',
    canvas: {
      backgroundColor: '#ffffff',
      backgroundImage: 'none'
    }
  },
  {
    id: 'tropical',
    labelKey: 'editor.templateTropical',
    preview: 'linear-gradient(#48b4ed 0 24%, #f8d58b 24% 58%, #42b8d7 58%)',
    canvas: {
      backgroundColor: '#f8d58b',
      backgroundImage: 'linear-gradient(180deg, transparent 0 44%, #d9a866 44% 45%, #f8d58b 45% 66%, #42b8d7 66% 67%, #278fc8 67%), repeating-linear-gradient(90deg, transparent 0 49px, rgba(49,78,75,.22) 50px 51px), repeating-linear-gradient(0deg, transparent 0 49px, rgba(49,78,75,.22) 50px 51px)'
    }
  },
  {
    id: 'island',
    labelKey: 'editor.templateGreen',
    preview: 'linear-gradient(135deg, #58b74d 0 30%, #96df4e 30% 70%, #58b74d 70%)',
    canvas: {
      backgroundColor: '#85d64d',
      backgroundImage: 'radial-gradient(ellipse at center, #a0e65c 0 45%, transparent 46%), repeating-linear-gradient(90deg, transparent 0 49px, rgba(25,83,49,.35) 50px 51px), repeating-linear-gradient(0deg, transparent 0 49px, rgba(25,83,49,.35) 50px 51px)'
    }
  },
  {
    id: 'river',
    labelKey: 'editor.templateRiver',
    preview: 'linear-gradient(135deg, #77cf3d 0 45%, #398ac1 45% 58%, #77cf3d 58%)',
    canvas: {
      backgroundColor: '#78ce3d',
      backgroundImage: 'linear-gradient(90deg, transparent 0 42%, #328ec4 43% 48%, #78ce3d 49%), repeating-linear-gradient(90deg, transparent 0 49px, rgba(38,92,50,.3) 50px 51px), repeating-linear-gradient(0deg, transparent 0 49px, rgba(38,92,50,.3) 50px 51px)'
    }
  },
  {
    id: 'boardwalk',
    labelKey: 'editor.templateBeach',
    preview: 'linear-gradient(#f5cf7b 0 40%, #98613d 40% 53%, #35afd2 53%)',
    canvas: {
      backgroundColor: '#f5cf7b',
      backgroundImage: 'linear-gradient(180deg, transparent 0 39%, #98613d 40% 52%, #f5cf7b 53% 62%, #35afd2 63%), repeating-linear-gradient(90deg, transparent 0 49px, rgba(74,74,44,.24) 50px 51px), repeating-linear-gradient(0deg, transparent 0 49px, rgba(74,74,44,.24) 50px 51px)'
    }
  },
  {
    id: 'gametion-village-lake',
    labelKey: 'editor.templateGametionVillageLake',
    preview: `url("${templateImages.map1}") center / cover no-repeat, #e2f0d9`,
    image: templateImages.map1,
    canvas: {
      backgroundColor: '#e2f0d9',
      backgroundImage: `url("${templateImages.map1}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  },
  {
    id: 'gametion-region-fields',
    labelKey: 'editor.templateGametionRegionFields',
    preview: `url("${templateImages.map2}") center / cover no-repeat, #e2f0d9`,
    image: templateImages.map2,
    canvas: {
      backgroundColor: '#e2f0d9',
      backgroundImage: `url("${templateImages.map2}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  },
  {
    id: 'gametion-lighthouse-cave',
    labelKey: 'editor.templateGametionLighthouseCave',
    preview: `url("${templateImages.map3}") center / cover no-repeat, #e2f0d9`,
    image: templateImages.map3,
    canvas: {
      backgroundColor: '#e2f0d9',
      backgroundImage: `url("${templateImages.map3}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  },
  {
    id: 'gametion-volcanic-cavern',
    labelKey: 'editor.templateGametionVolcanicCavern',
    preview: `url("${templateImages.map4}") center / cover no-repeat, #201818`,
    image: templateImages.map4,
    canvas: {
      backgroundColor: '#201818',
      backgroundImage: `url("${templateImages.map4}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  },
  {
    id: 'gametion-world-region',
    labelKey: 'editor.templateGametionWorldRegion',
    preview: `url("${templateImages.map5}") center / cover no-repeat, #1377b9`,
    image: templateImages.map5,
    canvas: {
      backgroundColor: '#1377b9',
      backgroundImage: `url("${templateImages.map5}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }
];

export const getTemplateById = (id) =>
  mapTemplates.find((template) => template.id === id) || mapTemplates[0];

export default mapTemplates;
