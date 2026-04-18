import fs from "fs/promises";
import path from "path";

const PROFILE_PATH = path.join(process.cwd(), "business-profile.json");

export async function getBusinessProfile() {
  try {
    const data = await fs.readFile(PROFILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return {
      name: process.env.NEXT_PUBLIC_BUSINESS_NAME || "FAIRDEALS BUSINESS",
      gstin: process.env.NEXT_PUBLIC_BUSINESS_GSTIN || "07AAACXXXXXXXXX",
      address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "123 Market Road, New Delhi, 110001",
      stateCode: process.env.BUSINESS_STATE_CODE || "07",
    };
  }
}

export async function setBusinessProfile(profile: any) {
  await fs.writeFile(PROFILE_PATH, JSON.stringify(profile, null, 2), "utf-8");
}
