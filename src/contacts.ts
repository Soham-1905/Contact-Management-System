export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateContactInput = Pick<Contact, "name" | "email" | "phone">;

export type UpdateContactInput = Partial<CreateContactInput>;

export function validateCreateContact(input: unknown): CreateContactInput{
    if (typeof input!== "object" || input === null || Array.isArray(input)){
        throw new Error("Request body must be an object");
    }   
    const body = input as Record<string, unknown>;
    if (typeof body.name !== "string" || body.name.trim() === ""){
        throw new Error("Name is required"); 
    }
    if (typeof body.email !== "string" || body.email.trim() === ""){
        throw new Error("Email is required");
    }
    if (typeof body.phone !== "string" || body.phone.trim() === ""){
        throw new Error("Phone is required");
    }
    return {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(), 
    };

}

export function validateUpdateContact(input:unknown): UpdateContactInput{
    if (typeof input !== "object" || input===null || Array.isArray(input)){
        throw new Error("Request body must be an object")
    }
    const body = input as Record<string, unknown>;
    const fields = Object.keys(body);

    if (fields.length === 0){
        throw new Error("Provide at least one field to update");
    }

    if (fields.some((field) => !["name", "email", "phone"].includes(field))){
        throw new Error("Only name, email and phone can be updated");
    }
    const update : UpdateContactInput = {};

    if ("name" in body){
        if (typeof body.name !=="string" || body.name.trim() === ""){
            throw new Error("Name cannot be empty");
            
        }
        update.name = body.name.trim();
    }
    if ("email" in body){
        if (typeof body.email !== "string" || body.email.trim() === ""){
            throw new Error("Email cannot be empty");
        }
        update.email = body.email.trim().toLowerCase();
    }
    if ("phone" in body){
        if (typeof body.phone !== "string" || body.phone.trim() === ""){
            throw new Error("Phone cannot be empty");
        }
        update.phone = body.phone.trim();
    }
    return update;
}
