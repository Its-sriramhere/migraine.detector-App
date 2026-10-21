import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getToken } from "./api";
import { config } from "../constants/config";

/**
 * Downloads an authenticated CSV endpoint and hands it to the native share
 * sheet. The web app used an <a download> anchor; mobile has no equivalent,
 * so the file is written to the cache directory and shared.
 */
export async function exportCsv(
  path: string,
  filename: string,
): Promise<{ shared: boolean; uri: string }> {
  const token = await getToken();
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error(`Export failed (${response.status})`);
  }
  const text = await response.text();

  const file = new File(Paths.cache, filename);
  try {
    file.create({ overwrite: true, intermediates: true });
  } catch {
    // file may already exist
  }
  file.write(text);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: `Share ${filename}`,
      UTI: "public.comma-separated-values-text",
    });
    return { shared: true, uri: file.uri };
  }
  return { shared: false, uri: file.uri };
}
