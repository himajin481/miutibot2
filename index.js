import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 💾 コマンド格納用コレクション
client.commands = new Collection();
client.autocompletes = new Collection();

// 🔄 コマンドファイル読み込み
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const commandModules = (await import(`file://${filePath}`)).default;

  for (const command of commandModules) {
    if (!command.data || !command.execute) {
      console.warn(`⚠️ ${file} のコマンドが無効です`);
      continue;
    }
    const name = command.data.name;
    client.commands.set(name, command);
    if (command.autocomplete) {
      client.autocompletes.set(name, command.autocomplete);
    }
  }
}

// ✅ Bot準備完了
client.once(Events.ClientReady, () => {
  console.log(`✅ Botログイン成功: ${client.user.tag}`);
});

// 💬 コマンド処理
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ コマンド実行中にエラーが発生しました。', ephemeral: true });
    }
  }

  // 🔤 オートコンプリート対応
  else if (interaction.isAutocomplete()) {
    const auto = client.autocompletes.get(interaction.commandName);
    if (auto) {
      try {
        await auto(interaction);
      } catch (error) {
        console.error('❌ オートコンプリートエラー:', error);
      }
    }
  }
});

// 🔑 トークンでログイン
client.login(process.env.TOKEN);
