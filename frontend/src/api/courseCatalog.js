// Free backends may take about a minute to wake after inactivity.
// Retry only the read-only catalog request, never checkout or other writes.
export async function getPublishedCourses(client, { signal } = {}) {
 for (let attempt = 0; attempt < 2; attempt++) {
  try {
   const { data } = await client.get("/courses?published=true", { signal, timeout: 90000 });
   if (!Array.isArray(data?.courses)) throw new Error("The course service returned an invalid response. Please try again.");
   return data.courses.filter(course => course.isPublished === true);
  } catch (error) {
   const temporary = ["ECONNABORTED", "ETIMEDOUT", "ERR_NETWORK"].includes(error.code) || [502,503,504].includes(error.response?.status);
   if (signal?.aborted || error.code === "ERR_CANCELED" || !temporary || attempt === 1) throw error;
  }
 }
}
