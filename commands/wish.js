import fs from 'fs';
import { SlashCommandBuilder } from 'discord.js';

const WISH_FILE = './data/wishes.json';

// 🔄 ファイル読み込み関数
function loadWishes() {
  try {
    return JSON.parse(fs.readFileSync(WISH_FILE));
  } catch {
    return [];
  }
}

// 💾 ファイル保存関数
function saveWishes(wishes) {
  fs.writeFileSync(WISH_FILE, JSON.stringify(wishes, null, 2));
}

// 🔧 コマンド定義
export default [
  {
    data: new SlashCommandBuilder()
      .setName('addwish')
      .setDescription('欲しいものを追加します')
      .addStringOption(opt =>
        opt.setName('item').setDescription('アイテム名').setRequired(true)
      )
      .addIntegerOption(opt =>
        opt.setName('amount').setDescription('欲しい数').setRequired(true)
      ),
    async execute(interaction) {
      const item = interaction.options.getString('item');
      const amount = interaction.options.getInteger('amount');
      const wishes = loadWishes();

      const existing = wishes.find(
        w => w.userId === interaction.user.id && w.item === item
      );
      if (existing) {
        return interaction.reply({
          content: `⚠️ すでに「${item}」は登録されています。削除してから再登録してください。`,
          ephemeral: true,
        });
      }

      wishes.push({ userId: interaction.user.id, item, amount });
      saveWishes(wishes);
      return interaction.reply(`✅ ${interaction.member.displayName} さんが「${item} ×${amount}」を追加しました！`);
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('listwish')
      .setDescription('みんなの欲しいものを表示します'),
    async execute(interaction) {
      const wishes = loadWishes();
      if (wishes.length === 0) {
        return interaction.reply('📭 欲しいものリストはまだ空っぽです！');
      }

      const lines = [];

      for (const wish of wishes) {
        try {
          const member = await interaction.guild.members.fetch(wish.userId);
          const name = member.displayName;
          lines.push(`👤 ${name}：${wish.item} ×${wish.amount}`);
        } catch {
          lines.push(`👤 不明なユーザー：${wish.item} ×${wish.amount}`);
        }
      }

      return interaction.reply(
        `🎁 **みんなの欲しいものリスト** 🎁\n\n${lines.join('\n')}`
      );
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName('delwish')
      .setDescription('自分の欲しいものを削除します')
      .addStringOption(opt =>
        opt.setName('item').setDescription('削除するアイテム名').setRequired(true)
      ),
    async execute(interaction) {
      const item = interaction.options.getString('item');
      const wishes = loadWishes();
      const index = wishes.findIndex(
        w => w.userId === interaction.user.id && w.item === item
      );

      if (index === -1) {
        return interaction.reply({
          content: `⚠️ 「${item}」はあなたのリストに見つかりませんでした。`,
          ephemeral: true,
        });
      }

      wishes.splice(index, 1);
      saveWishes(wishes);
      return interaction.reply(`🗑️ 「${item}」を削除しました！`);
    },
  },
];
