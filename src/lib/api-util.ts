/** Safely parse a fetch response as an array (returns [] on error or non-array body). */
export async function parseApiArray<T = unknown>(res: Response): Promise<T[]> {
	try {
		if (!res.ok) return [];
		const data = await res.json();
		return Array.isArray(data) ? data : [];
	} catch {
		return [];
	}
}
