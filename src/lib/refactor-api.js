const fs = require('fs');

const apis = ['products', 'transactions', 'stores', 'suppliers', 'purchases', 'customers', 'notifications'];

apis.forEach(api => {
    const file = `/home/xdk/Projects/storemgmt/src/app/api/${api}/route.ts`;
    if (!fs.existsSync(file)) return;
    
    let content = fs.readFileSync(file, 'utf8');
    
    if (!content.includes('getEffectiveAdminId')) {
        content = content.replace('import { NextResponse } from "next/server";', 'import { NextResponse } from "next/server";\nimport { getEffectiveAdminId } from "../../../lib/auth-util";');
    }

    const match = content.match(/const { dbConnect, ([A-Za-z]+) } = await import/);
    if (!match) return;
    const ModelName = match[1];

    // GET
    content = content.replace(
        /export async function GET\(\) \{\n(\s*)if \(isDev\)/, 
        `export async function GET(req: Request) {\n\tconst adminData = await getEffectiveAdminId();\n\tif (!adminData) return NextResponse.json([]);\n\n\tconst { searchParams } = new URL(req.url);\n\tconst storeId = searchParams.get("storeId");\n\n$1if (isDev)`
    );
    
    let findQuery = `const query: any = { clerkId: adminData.clerkId };\n\t\t// If the user has a restricted storeId OR if the client requested a specific store\n\t\tif (adminData.storeId) query.storeId = adminData.storeId;\n\t\telse if (storeId) query.storeId = storeId;\n\t\tconst data = await ${ModelName}.find(query);`;
    
    content = content.replace(`const data = await ${ModelName}.find({});`, findQuery);

    // POST
    content = content.replace(
        /export async function POST\(req: Request\) \{\n(\s*)const body = await req.json\(\);/, 
        `export async function POST(req: Request) {\n\tconst adminData = await getEffectiveAdminId();\n\tif (!adminData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });\n$1const body = await req.json();\n\tbody.clerkId = adminData.clerkId;`
    );

    // PUT
    content = content.replace(
        /export async function PUT\(req: Request\) \{\n(\s*)const body = await req.json\(\);/, 
        `export async function PUT(req: Request) {\n\tconst adminData = await getEffectiveAdminId();\n\tif (!adminData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });\n$1const body = await req.json();`
    );
    content = content.replace(
        `${ModelName}.findByIdAndUpdate(_id, updates, { new: true });`, 
        `${ModelName}.findOneAndUpdate({ _id, clerkId: adminData.clerkId }, updates, { new: true });`
    );

    // DELETE
    content = content.replace(
        /export async function DELETE\(req: Request\) \{\n(\s*)const \{ searchParams \}/, 
        `export async function DELETE(req: Request) {\n\tconst adminData = await getEffectiveAdminId();\n\tif (!adminData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });\n$1const { searchParams }`
    );
    content = content.replace(
        `${ModelName}.findByIdAndDelete(id);`, 
        `${ModelName}.findOneAndDelete({ _id: id, clerkId: adminData.clerkId });`
    );

    fs.writeFileSync(file, content);
});
