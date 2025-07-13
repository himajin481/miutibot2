import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;

const commands = [];
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const commandModule = (await import(`file://${filePath}`)).default;

  // ✅ export default で配列が来るケースに対応
  if (Array.isArray(commandModule)) {
    for (const cmd of commandModule) {
      if (cmd?.data && typeof cmd.data.toJSON === 'function') {
        commands.push(cmd.data.toJSON());
      } else {
        console.warn(`⚠️ ${file} 内のコマンドに .data が存在しないか toJSON できません`);
      }
    }
  }
  // ✅ export default 単体コマンドの形式にも対応
  else if (commandModule?.data && typeof commandModule.data.toJSON === 'function') {
    commands.push(commandModule.data.toJSON());
  } else {
    console.warn(`⚠️ ${file} は .data を持っていないためスキップされました`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

try {
  console.log('🔁 スラッシュコマンドを登録中...');
  await rest.put(
    Routes.applicationGuildCommands(clientId, guildId),
    { body: commands }
  );
  console.log('✅ コマンド登録完了！');
} catch (error) {
  console.error('❌ 登録失敗:', error);
}
