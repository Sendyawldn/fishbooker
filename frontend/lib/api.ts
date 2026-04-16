export const getSlots = async () => {
  const res = await fetch("http://localhost:8000/api/slots", {
    cache: "no-store", // Penting: Agar status lapak selalu update (tidak kena cache)
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Gagal mengambil data lapak");
  }

  const result = await res.json();
  return result;
};
