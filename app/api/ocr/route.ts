import { NextRequest, NextResponse } from "next/server";

type ParsedOCRData = {
  merchantName?: string;
  amount?: number;
  date?: string;
  description?: string;
  expenseLines?: string[];
  expenseType?: string;
  currency?: string;
  rawText?: string;
};

function cleanLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function detectCurrency(text: string): string {
  if (text.includes("₹") || /\bINR\b/i.test(text) || /\bRS\b/i.test(text)) {
    return "INR";
  }
  if (text.includes("$") || /\bUSD\b/i.test(text)) {
    return "USD";
  }
  if (text.includes("€") || /\bEUR\b/i.test(text)) {
    return "EUR";
  }
  if (text.includes("£") || /\bGBP\b/i.test(text)) {
    return "GBP";
  }
  return "INR";
}

function normalizeAmount(value: string): number | undefined {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return undefined;

  const amount = Number(cleaned);
  if (Number.isNaN(amount)) return undefined;

  return amount;
}

function isNoiseLine(line: string): boolean {
  return /invoice|receipt|bill no|phone|mobile|gstin|gst no|table|server|token|order id/i.test(
    line
  );
}

function isTaxLine(line: string): boolean {
  return /tax|gst|cgst|sgst|vat|service charge/i.test(line);
}

function extractAmountFromLine(line: string): number | undefined {
  const amountMatches = line.match(/(?:₹|rs\.?|inr|\$|€|£)?\s*([\d,]+(?:\.\d{1,2})?)/gi);

  if (!amountMatches?.length) return undefined;

  const values = amountMatches
    .map((entry) => {
      const match = entry.match(/([\d,]+(?:\.\d{1,2})?)/);
      return match?.[1] ? normalizeAmount(match[1]) : undefined;
    })
    .filter((value): value is number => value !== undefined);

  if (!values.length) return undefined;

  return values[values.length - 1];
}

function extractAmount(text: string): number | undefined {
  const lines = text
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);

  const highPriorityPatterns = [
    /grand total/i,
    /total amount/i,
    /amount due/i,
    /net amount/i,
    /amount payable/i,
    /final amount/i,
  ];

  const mediumPriorityPatterns = [
    /^total\b/i,
    /\btotal\b/i,
    /\bpaid\b/i,
    /\bbalance due\b/i,
  ];

  for (const pattern of highPriorityPatterns) {
    for (const line of lines) {
      if (pattern.test(line) && !isTaxLine(line) && !isNoiseLine(line)) {
        const amount = extractAmountFromLine(line);
        if (amount !== undefined) return amount;
      }
    }
  }

  for (const pattern of mediumPriorityPatterns) {
    for (const line of lines) {
      if (pattern.test(line) && !isTaxLine(line) && !isNoiseLine(line)) {
        const amount = extractAmountFromLine(line);
        if (amount !== undefined) return amount;
      }
    }
  }

  const candidateLines = lines.filter((line) => {
    const lower = line.toLowerCase();

    if (isNoiseLine(line)) return false;
    if (isTaxLine(line)) return false;
    if (/subtotal/i.test(lower)) return false;
    if (/discount/i.test(lower)) return false;
    if (/round off/i.test(lower)) return false;
    if (/change/i.test(lower)) return false;

    return /(?:₹|rs\.?|inr|\$|€|£)?\s*[\d,]+(?:\.\d{1,2})?/.test(line);
  });

  for (const line of candidateLines) {
    const amount = extractAmountFromLine(line);
    if (amount !== undefined && amount > 0) {
      return amount;
    }
  }

  return undefined;
}

function extractDate(text: string): string | undefined {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const monthMap: Record<string, string> = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };

  const parseDateFromString = (value: string): string | undefined => {
    // Format: 16 June 2025
    const dayMonthYearMatch = value.match(
      /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i
    );

    if (dayMonthYearMatch) {
      const [, day, month, year] = dayMonthYearMatch;
      return `${year}-${monthMap[month.toLowerCase()]}-${day.padStart(2, "0")}`;
    }

    // Format: June 16 2025
    const monthDayYearMatch = value.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i
    );

    if (monthDayYearMatch) {
      const [, month, day, year] = monthDayYearMatch;
      return `${year}-${monthMap[month.toLowerCase()]}-${day.padStart(2, "0")}`;
    }

    // Format: 16/06/2025 or 16-06-2025
    const numericMatch = value.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
    if (numericMatch) {
      const [, day, month, year] = numericMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // Format: 2025-06-16
    const isoMatch = value.match(/\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // Format: 16/06/25
    const shortYearMatch = value.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/);
    if (shortYearMatch) {
      const [, day, month, year] = shortYearMatch;
      return `20${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return undefined;
  };

  const negativeKeywords = /(pay by|due date|due|delivery date|ship date|expiry|exp date)/i;
  const strongPositiveKeywords = /(invoice date|bill date|receipt date|transaction date|date:)/i;
  const mildPositiveKeywords = /\bdate\b/i;

  const strongPositiveLines = lines.filter(
    (line) => strongPositiveKeywords.test(line) && !negativeKeywords.test(line)
  );

  for (const line of strongPositiveLines) {
    const parsed = parseDateFromString(line);
    if (parsed) return parsed;
  }

  const mildPositiveLines = lines.filter(
    (line) => mildPositiveKeywords.test(line) && !negativeKeywords.test(line)
  );

  for (const line of mildPositiveLines) {
    const parsed = parseDateFromString(line);
    if (parsed) return parsed;
  }

  const neutralLines = lines.filter((line) => !negativeKeywords.test(line));

  for (const line of neutralLines) {
    const parsed = parseDateFromString(line);
    if (parsed) return parsed;
  }

  return undefined;
}

function extractMerchantName(text: string): string | undefined {
  const lines = text
    .split("\n")
    .map(cleanLine)
    .filter(Boolean)
    .filter((line) => line.length > 2)
    .filter(
      (line) =>
        !/invoice|receipt|bill|tax|gst|cgst|sgst|phone|mobile|table|server|token|date|time/i.test(
          line
        )
    );

  return lines[0];
}

function extractExpenseLines(text: string): string[] {
  const ignoredPatterns =
    /total|grand total|amount|tax|gst|cgst|sgst|invoice|receipt|date|time|cash|change|thank you|subtotal|discount|round off/i;

  return text
    .split("\n")
    .map(cleanLine)
    .filter((line) => line.length > 2)
    .filter((line) => !ignoredPatterns.test(line))
    .slice(1, 6);
}

function detectExpenseType(text: string): string {
  const lower = text.toLowerCase();

  if (/(restaurant|cafe|coffee|burger|pizza|meal|food|lunch|dinner|tea|snacks)/i.test(lower)) {
    return "Meals";
  }
  if (/(flight|airlines|train|bus|travel|trip)/i.test(lower)) {
    return "Travel";
  }
  if (/(uber|ola|taxi|cab|auto|transport|rapido)/i.test(lower)) {
    return "Transport";
  }
  if (/(hotel|lodging|accommodation|stay|inn|resort)/i.test(lower)) {
    return "Accommodation";
  }
  if (/(stationery|office|printer|supplies)/i.test(lower)) {
    return "Office Supplies";
  }
  if (/(hospital|medical|pharmacy|clinic|medicine)/i.test(lower)) {
    return "Medical";
  }

  return "Other";
}

function buildDescription(merchantName?: string, expenseType?: string): string {
  if (merchantName && expenseType) {
    return `${expenseType} expense from ${merchantName}`;
  }
  if (merchantName) {
    return `Expense from ${merchantName}`;
  }
  return "Scanned receipt expense";
}

function parseOCRText(rawText: string): ParsedOCRData {
  const merchantName = extractMerchantName(rawText);
  const amount = extractAmount(rawText);
  const date = extractDate(rawText);
  const currency = detectCurrency(rawText);
  const expenseType = detectExpenseType(rawText);
  const expenseLines = extractExpenseLines(rawText);
  const description = buildDescription(merchantName, expenseType);

  return {
    merchantName,
    amount,
    date,
    description,
    expenseLines,
    expenseType,
    currency,
    rawText,
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const apiKey = process.env.OCR_SPACE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OCR API key is missing in .env.local" },
        { status: 500 }
      );
    }

    const ocrForm = new FormData();
    ocrForm.append("file", file);
    ocrForm.append("apikey", apiKey);
    ocrForm.append("language", "eng");
    ocrForm.append("isOverlayRequired", "false");
    ocrForm.append("isTable", "true");
    ocrForm.append("scale", "true");
    ocrForm.append("OCREngine", "2");

    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: ocrForm,
    });

    const ocrResult = await ocrResponse.json();

    const parsedText =
      ocrResult?.ParsedResults?.map((item: { ParsedText?: string }) => item.ParsedText || "")
        .join("\n")
        .trim() || "";

    if (!parsedText) {
      return NextResponse.json(
        { error: "No text could be extracted from the receipt" },
        { status: 422 }
      );
    }

    const parsedData = parseOCRText(parsedText);

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error("OCR route error:", error);
    return NextResponse.json(
      { error: "Failed to process OCR request" },
      { status: 500 }
    );
  }
}

