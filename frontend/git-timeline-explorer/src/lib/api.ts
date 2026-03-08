import axios from "axios";
import { AnalysisData, generateMockData, normalizeApiResponse } from "./mockData";

const API_URL = "http://localhost:8000";

export const analyzeRepo = async (
  repoUrl: string,
  rangeDays?: number
): Promise<AnalysisData> => {
  try {
    const response = await axios.post(`${API_URL}/analyze`, {
      repo_url: repoUrl,
      range_days: rangeDays
    });
    return normalizeApiResponse(response.data, repoUrl);
  } catch {
    // Fallback to mock data for demo/hackathon
    console.warn("Backend unavailable — using mock data");
    await new Promise((r) => setTimeout(r, 2000));
    return generateMockData(repoUrl);
  }
};
