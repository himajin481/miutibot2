import {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from 'discord.js';
import { readFileSync, writeFileSync } from 'fs';

const locationFile = './data/locations.json';
let locations = {};

function loadLocations() {
  try {
    const data = readFileSync(locationFile, 'utf8');
    locations = JSON.parse(data);
  } catch (error) {
    locations = {};
  }
}

function saveLocations() {
  try {
    writeFileSync(locationFile, JSON.stringify(locations, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ 保存エラー:', error);
  }
}

export default [
  {
    data: new SlashCommandBuilder()
      .setName('座標追加')
      .setDescription('座標を登録します')
      .addStringOption(opt => opt.setName('場所').setDescription('登録する名前').setRequired(true))
      .addIntegerOption(opt => opt.setName('x').setDescription('X座標').setRequired(true))
      .addIntegerOption(opt => opt.setName('y').setDescription('Y座標').setRequired(true))
      .addIntegerOption(opt => opt.setName('z').setDescription('Z座標').setRequired(true)),
    async execute(interaction) {
      loadLocations();
      const place = interaction.options.getString('場所');
      const x = interaction.options.getInteger('x');
      const y = interaction.options.getInteger('y');
      const z = interaction.options.getInteger('z');
      const coords = `x=${x}, y=${y}, z=${z}`;
      locations[place] = coords;
      saveLocations();
      await interaction.reply(`✅ **${place}** を **${coords}** で登録しました！`);
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('座標検索')
      .setDescription('登録された座標を検索します')
      .addStringOption(opt => opt.setName('場所').setDescription('検索する場所名').setRequired(true)),
    async execute(interaction) {
      loadLocations();
      const place = interaction.options.getString('場所');
      if (!locations[place]) {
        return interaction.reply('⚠️ その場所の情報は登録されていません。');
      }
      await interaction.reply(`📍 **${place}** の座標: ${locations[place]}`);
    },
    async autocomplete(interaction) {
      loadLocations();
      const focused = interaction.options.getFocused();
      const filtered = Object.keys(locations).filter(k => k.includes(focused));
      await interaction.respond(filtered.map(k => ({ name: k, value: k })));
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('座標一覧')
      .setDescription('登録されている座標を一覧表示します'),
    async execute(interaction) {
      loadLocations();
      const entries = Object.entries(locations);
      if (entries.length === 0) {
        return interaction.reply('📭 登録されている座標はありません。');
      }
      const list = entries.map(([name, coord]) => `📍 **${name}** → ${coord}`).join('\n');
      await interaction.reply(`🗺️ 座標一覧:\n\n${list}`);
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('座標削除')
      .setDescription('登録した座標を削除します')
      .addStringOption(opt => opt.setName('場所').setDescription('削除する名前').setRequired(true)),
    async execute(interaction) {
      loadLocations();
      const place = interaction.options.getString('場所');
      if (!locations[place]) {
        return interaction.reply({ content: `⚠️ **${place}** は登録されていません。`, ephemeral: true });
      }

      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_delete')
        .setLabel('はい、削除する')
        .setStyle(ButtonStyle.Danger);
      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_delete')
        .setLabel('いいえ')
        .setStyle(ButtonStyle.Secondary);
      const row = new ActionRowBuilder().addComponents(cancelButton, confirmButton);

      const response = await interaction.reply({
        content: `本当に **${place}** の情報を削除しますか？`,
        components: [row],
        ephemeral: true
      });

      const filter = i => i.user.id === interaction.user.id;
      try {
        const confirmation = await response.awaitMessageComponent({ filter, time: 60_000 });

        if (confirmation.customId === 'confirm_delete') {
          delete locations[place];
          saveLocations();
          await confirmation.update({ content: `🗑️ **${place}** の情報を削除しました。`, components: [] });
        } else {
          await confirmation.update({ content: '❌ 削除をキャンセルしました。', components: [] });
        }
      } catch {
        await interaction.editReply({ content: '⌛ タイムアウト。削除をキャンセルしました。', components: [] });
      }
    },
    async autocomplete(interaction) {
      loadLocations();
      const focused = interaction.options.getFocused();
      const filtered = Object.keys(locations).filter(k => k.includes(focused));
      await interaction.respond(filtered.map(k => ({ name: k, value: k })));
    }
  }
];
