  import { supabase } from "../../../src/lib/supabase";

  const ABSOLUTE_URL_REGEX = /^(https?:)?\/\//i;

  export const DEFAULT_PRODUCT_IMAGE = "";
  export const DEFAULT_BRAND_IMAGE = "";
  export const DEFAULT_CATEGORY_IMAGE = "";
  export const DEFAULT_LOGO_IMAGE = "/assets/img/logo_gorrion.png";
  export const DEFAULT_BANNER_IMAGE = "";
  const STORAGE_BUCKET = "imagenes";
  const COMMON_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];


  type GenericRow = Record<string, unknown> | null | undefined;

  export function getField<T>(row: GenericRow, ...keys: string[]) {
    for (const key of keys) {
      const value = row?.[key];
      if (value !== undefined && value !== null) {
        return value as T;
      }
    }

    return null;
  }

  function isDirectImageValue(value: string | null) {
    if (!value) return false;

    return (
      value.startsWith("data:image/") ||
      value.startsWith("/") ||
      ABSOLUTE_URL_REGEX.test(value)
    );
  }

  function normalizeStringValue(value: string | null) {
    const normalized = value?.trim() ?? "";
    return normalized || null;
  }

  function looksLikeFileReference(value: string | null) {
    if (!value) return false;

    return (
      value.includes("/") ||
      value.includes("\\") ||
      /\.[A-Za-z0-9]{2,5}$/i.test(value)
    );
  }

  function resolveDirectAssetValue(...values: Array<string | null | undefined>) {
    for (const value of values) {
      const normalized = normalizeStringValue(value ?? null);
      if (isDirectImageValue(normalized)) {
        return normalized;
      }
    }

    return null;
  }

  function hasImageExtension(value: string) {
    return /\.[A-Za-z0-9]{2,5}$/i.test(value);
  }

  function buildStorageFileCandidates(folderName: string, fileName: string | null) {
    const normalizedFileName = normalizeStringValue(fileName);
    if (!normalizedFileName) {
      return [];
    }

    const cleanFileName = normalizedFileName.replace(/\\/g, "/").replace(/^\/+/, "");
    const basePath = cleanFileName.includes("/") ? cleanFileName : `${folderName}/${cleanFileName}`;
    const candidates = [basePath];

    if (!hasImageExtension(basePath)) {
      for (const extension of COMMON_IMAGE_EXTENSIONS) {
        candidates.push(`${basePath}${extension}`);
      }
    }

    return candidates.filter((value, index, array) => array.indexOf(value) === index);
  }

  export function buildStorageImageUrls(
    folderName: string,
    fileName: string | null,
    getStorageUrl: (bucketName: string, filePath: string) => string | null
  ) {
    return buildStorageFileCandidates(folderName, fileName)
      .map((candidate) => getStorageUrl(STORAGE_BUCKET, candidate))
      .filter((value): value is string => Boolean(value))
      .filter((value, index, array) => array.indexOf(value) === index);
  }

  function normalizeAssetLookupValue(value: string | null) {
    const normalized = normalizeStringValue(value);
    if (!normalized) {
      return "";
    }

    return normalized
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  export async function listStorageFolderFiles(folderName: string) {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list(folderName, {
      limit: 200,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw error;
    }

    return (data ?? [])
      .map((item) => item.name)
      .filter((item): item is string => Boolean(item));
  }

  export function resolveStorageFileName(
    fileName: string | null,
    fallbackName: string | null,
    availableFiles: string[]
  ) {
    const candidates = [fileName, fallbackName]
      .map((value) => normalizeAssetLookupValue(value))
      .filter(Boolean);

    if (candidates.length === 0 || availableFiles.length === 0) {
      return null;
    }

    const fileMap = new Map(
      availableFiles.map((item) => [normalizeAssetLookupValue(item), item] as const)
    );

    for (const candidate of candidates) {
      const exact = fileMap.get(candidate);
      if (exact) {
        return exact;
      }
    }

    for (const item of availableFiles) {
      const normalizedItem = normalizeAssetLookupValue(item);
      if (candidates.some((candidate) => normalizedItem.includes(candidate) || candidate.includes(normalizedItem))) {
        return item;
      }
    }

    return null;
  }

  export function resolveFolderImage(
    folderName: string,
    fileName: string | null,
    getStorageUrl: (bucketName: string, filePath: string) => string | null,
    defaultImage = ""
  ) {
    const candidates = buildStorageImageUrls(folderName, fileName, getStorageUrl);
    return candidates[0] ?? defaultImage;
  }

  const BUCKET = "imagenes";
  export function resolveImageSource(options: {
    directUrl?: string | null;
    bucketName?: string | null;
    fileName?: string | null;
    defaultImage: string;
    getStorageUrl: (bucketName: string | null, fileName: string | null) => string | null;
  }) {
    const {
      directUrl = null,
      bucketName = null,
      fileName = null,
      defaultImage,
      getStorageUrl,
    } = options;

    const normalizedDirectUrl = normalizeStringValue(directUrl);
    const normalizedBucketName = normalizeStringValue(bucketName);
    const normalizedFileName = normalizeStringValue(fileName);

    const directAsset = resolveDirectAssetValue(
      normalizedDirectUrl,
      normalizedFileName,
      normalizedBucketName
    );

    if (directAsset) {
      return directAsset;
    }

    if (normalizedBucketName && normalizedFileName) {
      const storageUrl = getStorageUrl(normalizedBucketName, normalizedFileName);
      if (storageUrl) {
        return storageUrl;
      }
    }

    return defaultImage;
  }

  export function resolveCatalogImage(
    row: GenericRow,
    getStorageUrl: (bucketName: string, filePath: string) => string | null
  ) {
    const imageFileName = getField<string>(
      row,
      "prdcImgNombreBucket",
      "prdcimgnombrebucket"
    );

    const normalizedImageName = normalizeStringValue(imageFileName);

    if (!normalizedImageName) {
      return "";
    }

    const fullPath = `producto/${normalizedImageName}`;

    return getStorageUrl(BUCKET, fullPath) || "";
  }

  export function resolveBrandImage(
    row: GenericRow,
    getStorageUrl: (bucketName: string, filePath: string) => string | null
  ) {
    const imageFileName = getField<string>(
      row,
      "marcaImgNombreBucket",
      "marcaimgnombrebucket"
    );

    return resolveFolderImage("marca", imageFileName, getStorageUrl, DEFAULT_BRAND_IMAGE);
  }
  export function getStorageUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl ?? null;
  }
