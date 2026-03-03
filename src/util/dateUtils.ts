export class DateUtils {
  /**
   * Generates a "Wall Clock" ISO string for Indian Standard Time.
   * Format: YYYY-MM-DDTHH:mm:ss.sss (No 'Z' suffix)
   */
  static getISTDate(date: Date = new Date()): string {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    return istDate.toISOString().replace("Z", "");
  }

  /**
   * Utility to format a UTC string back to IST for display
   */
  static formatToISTDisplay(dateString: string): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  static getDateRange(
    mode: string,
    customStart?: string,
    customEnd?: string,
  ): [string, string] {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (mode) {
      case "today": {
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      }

      case "week": {
        const day = today.getDay(); // Sunday=0
        const diffToMonday = day === 0 ? -6 : 1 - day; // Monday start
        startDate = new Date(today);
        startDate.setDate(today.getDate() + diffToMonday);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      }

      case "month": {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1); // 1st day
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // last day
        break;
      }

      case "custom": {
        if (!customStart || !customEnd)
          throw new Error("Custom start and end dates required");
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        break;
      }

      default: {
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      }
    }

    const formatDate = (d: Date): string => d.toISOString().split("T")[0];
    return [formatDate(startDate), formatDate(endDate)];
  }

  /**
   * Returns local start and end of day strings for queries.
   * Example: ["2026-02-23T00:00:00.000", "2026-02-23T23:59:59.999"]
   */
  static getTodayWindow(): [string, string] {
    const today = new Date().toISOString().split("T")[0];
    return [`${today}T00:00:00.000`, `${today}T23:59:59.999`];
  }

  /**
   * Converts a string like "TUESDAY, 03 MARCH 2026" to "03-03-2026"
   */
  static parseWallClockDate(input: string): string {
    if (!input) return "";

    // Remove weekday
    const parts = input.split(", ");
    if (parts.length < 2) return "";

    const datePart = parts[1]; // "03 MARCH 2026"
    const [day, monthName, year] = datePart.split(" ");

    // Create JS Date
    const date = new Date(`${monthName} ${day}, ${year}`);
    if (isNaN(date.getTime())) return "";

    // Format as DD-MM-YYYY
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
  }
}
