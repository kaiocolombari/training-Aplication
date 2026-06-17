export default function safeNumber(value: any) {
    const n = Number(value);

    return Number.isFinite(n)
      ? n
      : 0;
  }