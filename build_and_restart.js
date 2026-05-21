const { execSync } = require('child_process');

try {
    console.log('Finding processes on port 5000...');
    const output = execSync('netstat -ano | findstr ":5000"').toString();
    const lines = output.split('\n').filter(l => l.includes('LISTENING'));

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
            console.log(`Killing PID ${pid}...`);
            execSync(`taskkill /F /PID ${pid}`);
        }
    }
} catch (e) {
    console.log('No process found on port 5000 or error killing.');
}
console.log('Pushing database schema...');
try {
    execSync('cmd.exe /c "npx prisma db push --accept-data-loss"', { stdio: 'inherit' });
} catch (e) {
    console.error('Prisma DB Push failed!');
    process.exit(1);
}

console.log('Generating Prisma Client...');
try {
    execSync('cmd.exe /c "npx prisma generate"', { stdio: 'inherit' });
} catch (e) {
    console.error('Prisma Generate failed!');
    process.exit(1);
}

console.log('Compiling TypeScript...');
try {
    execSync('cmd.exe /c "npx tsc"', { stdio: 'inherit' });
} catch (e) {
    console.error('TypeScript Compilation failed!');
    process.exit(1);
}

console.log('Done restarting process. Now you can run: node dist/server.js');
