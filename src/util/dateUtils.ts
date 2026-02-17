export class DateUtils {
  /**
   * Generates a "Wall Clock" ISO string for Indian Standard Time.
   * Format: YYYY-MM-DDTHH:mm:ss.sss (No 'Z' suffix)
   */
  static getISTDate(date: Date = new Date()): string {
    // Offset for IST (UTC + 5.5 hours)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);

    // Convert to ISO and remove the 'Z' (Zulu/UTC) indicator
    // This tells the DB to treat the time exactly as written
    return istDate.toISOString().replace("Z", "");
  }

  /**
   * Utility to format a UTC string back to IST for display
   */
  static formatToISTDisplay(dateString: string): string {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
