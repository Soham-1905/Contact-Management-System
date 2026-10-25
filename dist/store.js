import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const dataFilePath = join(dirname(fileURLToPath(import.meta.url)), "../data/contacts.json");
export async function readContacts() {
    try {
        const contents = await readFile(dataFilePath, "utf-8");
        return JSON.parse(contents);
    }
    catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
        await mkdir(dirname(dataFilePath), { recursive: true });
        await writeFile(dataFilePath, "[]\n", "utf-8");
        return [];
    }
}
export async function writeContacts(contacts) {
    await mkdir(dirname(dataFilePath), { recursive: true });
    await writeFile(dataFilePath, JSON.stringify(contacts, null, 2), "utf-8");
}
export async function findContactById(id) {
    const contacts = await readContacts();
    return contacts.find((contact) => contact.id === id);
}
