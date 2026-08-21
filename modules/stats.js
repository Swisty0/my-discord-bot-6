const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Günlük sayaçları tutmak için geçici bellek nesnesi
const statsData = {
    joinsToday: 0,
    leavesToday: 0,
    lastReset: new Date().toDateString()
};

function checkDayReset() {
    const currentDate = new Date().toDateString();
    if (statsData.lastReset !== currentDate) {
        statsData.joinsToday = 0;
        statsData.leavesToday = 0;
        statsData.lastReset = currentDate;
    }
}

function registerStatsModule(client) {
    // Üye katıldığında
    client.on('guildMemberAdd', member => {
        checkDayReset();
        statsData.joinsToday++;
    });

    // Üye ayrıldığında
    client.on('guildMemberRemove', member => {
        checkDayReset();
        statsData.leavesToday++;
    });

    // Komut ile istatistikleri görme (!istatistik)
    client.on('messageCreate', async message => {
        if (message.author.bot) return;
        if (message.content === '!istatistik') {
            // Sadece yönetici (Administrator) yetkisine sahip olanlar kullanabilir
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply({ content: '❌ Bu komutu sadece yöneticiler kullanabilir!', ephemeral: true });
            }

            checkDayReset();
            const guild = message.guild;

            // Sunucu detaylı hesaplamaları
            const totalMembers = guild.memberCount;
            const botCount = guild.members.cache.filter(m => m.user.bot).size;
            const humanCount = totalMembers - botCount;
            const boostCount = guild.premiumSubscriptionCount || 0;
            const boostTier = guild.premiumTier;

            const embed = new EmbedBuilder()
                .setColor('#3b82f6')
                .setTitle('📊 Sunucu İstatistik ve Durum Raporu')
                .setDescription('Bu rapor yalnızca yöneticilere özel olarak güncel verilerle listelenmiştir.')
                .addFields(
                    { name: '📥 Bugün Giren Üye', value: `\`${statsData.joinsToday} kişi\``, inline: true },
                    { name: '📤 Bugün Çıkan Üye', value: `\`${statsData.leavesToday} kişi\``, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true }, // Boşluk
                    { name: '👥 Toplam Üye', value: `\`${totalMembers}\``, inline: true },
                    { name: '👤 Gerçek Üye / Bot', value: `\`${humanCount}\` üye / \`${botCount}\` bot`, inline: true },
                    { name: '💎 Takviye (Boost) Durumu', value: `Seviye: \`${boostTier}\` (${boostCount} Boost)`, inline: true }
                )
                .setFooter({ text: `${guild.name} — Yetkili İstatistik Sistemi`, iconURL: guild.iconURL() })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        }
    });
}

module.exports = { registerStatsModule };
