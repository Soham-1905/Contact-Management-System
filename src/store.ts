import {mkdir, readFile, writeFile} from "node:fs/promises";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import type {Contact} from "./contacts.js";

const dataFilePath = join(dirname(fileURLToPath(import.meta.url)), "../data/contacts.json",);

export async function readContacts(): Promise<Contact[]> {
    try{
        const contents = await readFile(dataFilePath, "utf-8");
        return JSON.parse(contents) as Contact[];
    }
    catch(error){
        if((error as NodeJS.ErrnoException).code !== "ENOENT"){
            throw error;
        }
        await mkdir(dirname(dataFilePath), {recursive: true});
        await writeFile(dataFilePath, "[]\n", "utf-8");
        return [];

    }

}

export async function writeContacts(contacts: Contact[]): Promise<void> {
    await mkdir(dirname(dataFilePath), {recursive: true});
    await writeFile(dataFilePath, JSON.stringify(contacts, null, 2), "utf-8");
}

export async function findContactById(id:string): Promise<Contact | undefined>{
    const contacts = await readContacts();
    return contacts.find((contact)=> contact.id === id);

}