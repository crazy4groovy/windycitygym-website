const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const PLACEHOLDER_KEY = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

interface Web3FormsResult {
  success: boolean;
  message: string;
}

export { PLACEHOLDER_KEY };

export async function submitToWeb3Forms(
  formData: Record<string, string>,
  accessKey: string | undefined
): Promise<Web3FormsResult> {
  if (!accessKey || accessKey === PLACEHOLDER_KEY) {
    return {
      success: false,
      message: "Form is not configured. Set VITE_WEB3FORMS_ACCESS_KEY in your .env file.",
    };
  }

  if (formData.botcheck) {
    return { success: true, message: "Submission skipped (bot detected)." };
  }

  const payload = { ...formData, access_key: accessKey };
  delete (payload as Record<string, string>).botcheck;

  try {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return { success: true, message: result.message || "Email sent successfully!" };
    }

    return {
      success: false,
      message: result.message || `Submission failed (HTTP ${response.status}).`,
    };
  } catch {
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
}