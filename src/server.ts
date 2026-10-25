import {createServer, type IncomingMessage} from "node:http";
import { randomUUID } from "node:crypto";
import { validateCreateContact, type Contact, validateUpdateContact, type UpdateContactInput } from "./contacts.js";
import { findContactById, readContacts, writeContacts } from "./store.js";
async function readJsonBody(request: IncomingMessage): Promise<unknown> {
    let body = "";
    for await (const chunk of request){
        body = body+ chunk.toString();
    }
    try{
        return JSON.parse(body);
    }
    catch{
        throw new Error("Invalid JSON body")
    }
    
}
const port = Number(process.env.PORT || 3000);

const server = createServer(async(request,response)=>{
    const requestUrl = new URL(request.url ?? "/", "http://localhost")
    if (request.method === "GET" && requestUrl.pathname === "/health"){
        response.writeHead(200, {"Content-Type":"application/json"});
        response.end(JSON.stringify({status: "ok"}));
        return;
    }
    if (request.method === "GET" && requestUrl.pathname === '/contacts'){
        const contacts = await readContacts();
        const searchText = requestUrl.searchParams.get("q")?.toLowerCase();

        const results = searchText ? contacts.filter((contact)=>
            contact.name.toLowerCase().includes(searchText)||
            contact.email.toLowerCase().includes(searchText),
        ) : contacts;
        response.writeHead(200, {"Content-Type": "application/json"});
        response.end(JSON.stringify(results));
        return;

    }
    if (request.method === "GET" && requestUrl.pathname.startsWith("/contacts/")){
        const id = requestUrl.pathname.slice("/contacts/".length);
        const contact = await findContactById(id);
        if (!contact){
            response.writeHead(404, {"Content-Type" : "application/json"});
            response.end(JSON.stringify({error: "Contact not found"}));
            return;
        }
        response.writeHead(200, {"Content-Type" : "application/json"});
        response.end(JSON.stringify(contact));
        return;
    }
    if (request.method === "PATCH" && requestUrl.pathname.startsWith("/contacts/")){
        const id = requestUrl.pathname.slice("/contacts/".length);
        let updates: UpdateContactInput;
        try{
            updates = validateUpdateContact(await readJsonBody(request));
        }
        catch(error){
            const message = error instanceof Error ? error.message: "Invalid request";
            response.writeHead(400, {"Content-Type": "application/json"});
            response.end(JSON.stringify({error : message}));
            return ;
        }
        const contacts = await readContacts();
        const contactIndex = contacts.findIndex((contact)=> contact.id === id);

        if (contactIndex === -1){
            response.writeHead(404, {"Content-Type":"application/json"});
            response.end(JSON.stringify({error : "Contact Not Found"}));
            return ;
        }
        if (updates.email && contacts.some((contact)=>contact.id !==id && contact.email.toLowerCase() === updates.email,)){
            response.writeHead(409, {"Content-Type": "application/json"});
            response.end(JSON.stringify({error: "Email already exists"}));
            return ;
        }
        const updatedContact = {
            ...contacts[contactIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
        }
        contacts[contactIndex] = updatedContact;
        await writeContacts(contacts);
        response.writeHead(200, {"Content-Type": "application/json"});
        response.end(JSON.stringify(updatedContact));
        return;
    }
    if (request.method === "DELETE" && requestUrl.pathname.startsWith("/contacts/")){
        const id = requestUrl.pathname.slice("/contacts/".length);
        const contacts = await readContacts();
        const contactIndex = contacts.findIndex((contact)=> contact.id === id);
        if (contactIndex === -1){
            response.writeHead(404, {"Content-Type" : "application/json"});
            response.end(JSON.stringify({error: "Contact Not Found"}));
            return;
        }
        contacts.splice(contactIndex, 1);
        await writeContacts(contacts);
        response.writeHead(204);
        response.end();
        return;
    }
    if (request.method==="POST" && requestUrl.pathname=== "/contacts"){
        let contactInput;

        try{
            contactInput = validateCreateContact(await readJsonBody(request))
        }
        catch(error){
            const message = error instanceof Error ? error.message: "Invalid request";
            response.writeHead(400, {"Content-Type": "application/json"});
            response.end(JSON.stringify({error: message}))
            return ;
        }

        const contacts = await readContacts();
        const emailExists = contacts.some((contact)=> contact.email.toLowerCase() === contactInput.email.toLowerCase());
        if (emailExists){
            response.writeHead(409, {"Content-Type" : "application/json"});
            response.end(JSON.stringify({error: "Email already exists"}));
            return;
        }
        const now = new Date().toISOString();
        const newContact: Contact = {
            id: randomUUID(),
            ...contactInput,
            createdAt: now,
            updatedAt: now,
        }
        contacts.push(newContact);
        await writeContacts(contacts);
        response.writeHead(201, {"Content-Type" : "application/json"});
        response.end(JSON.stringify(newContact));
        return;
    }
    response.writeHead(404, {"Content-Type":"application/json"});
    response.end(JSON.stringify({error: "Route Not Found"}));
})

server.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})