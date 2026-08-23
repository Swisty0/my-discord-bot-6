const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

// Çekilişleri hafızada tutmak için Map
const giveaways = new Map();

module.exports = {
    // Eğer modül sistemin doğrudan bir komut nesnesi bekliyorsa:
    data: new SlashCommandBuilder()
        .setName('çekiliş')
        .setDescription('Detaylı ve butonlu çekiliş başlatır.')
        .addStringOption(option => 
            option.setName('ödül')
                .setDescription('Verilecek ödül nedir?')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('süre')
                .setDescription('Çekiliş süresi kaç dakika olsun?')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('kazanan')
                .setDescription('Kaç kişi kazansın?')
                .setRequired(true)),

    async execute(interaction) {
        const prize = interaction.options.getString('ödül');
        const durationMinutes = interaction.options.getInteger('süre');
        const winnerCount = interaction.options.getInteger('kazanan');

        const endTime = Date.now() + (durationMinutes * 60 * 1000);
        const endsTimestamp = Math.floor(endTime / 1000);

        // Çekiliş Embed Tasarımı
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎉 **ÇEKİLİŞ BAŞLADI!** 🎉')
            .setDescription(`Aşağıdaki butona basarak çekilişe katılabilirsin!\n\n🎁 **Ödül:** **${prize}**\n👑 **Kazanan Sayısı:** \`${winnerCount} Kişi\`\n⏰ **Bitiş Zamanı:** <t:${endsTimestamp}:R> (<t:${endsTimestamp}:F>)`)
            .setFooter({ text: `${interaction.user.tag} tarafından düzenleniyor`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp(endTime);

        // Katıl Butonu
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('join_giveaway')
                .setLabel('🎉 Çekilişe Katıl (0)')
                .setStyle(ButtonStyle.Primary)
        );

        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        const participants = new Set();

        giveaways.set(message.id, {
            prize,
            winnerCount,
            participants,
            endTime,
            host: interaction.user.id,
            ended: false
        });

        // Süre bitince çalışacak zamanlayıcı
        const interval = setInterval(async () => {
            const giveaway = giveaways.get(message.id);
            if (!giveaway || giveaway.ended) {
                clearInterval(interval);
                return;
            }

            if (Date.now() >= giveaway.endTime) {
                giveaway.ended = true;
                clearInterval(interval);

                const participantArray = Array.from(giveaway.participants);
                let winnersText = "";

                if (participantArray.length === 0) {
                    winnersText = "Hiç kimse katımadığı için çekiliş iptal edildi! 😢";
                } else {
                    const winners = [];
                    const count = Math.min(winnerCount, participantArray.length);
                    
                    for (let i = 0; i < count; i++) {
                        const randomIndex = Math.floor(Math.random() * participantArray.length);
                        winners.push(participantArray.splice(randomIndex, 1)[0]);
                    }

                    winnersText = winners.map(id => `<@${id}>`).join(', ');
                }

                const endedEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle('🎉 **ÇEKİLİŞ SONUÇLANDI** 🎉')
                    .setDescription(`🎁 **Ödül:** **${prize}**\n👑 **Kazananlar:** ${winnersText}\n👤 **Düzenleyen:** <@${giveaway.host}>`)
                    .setTimestamp();

                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('join_giveaway')
                        .setLabel('Çekiliş Sona Erdi')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

                await message.edit({ embeds: [endedEmbed], components: [disabledRow] });
                await interaction.followUp({ content: `🎉 Tebrikler ${winnersText}! **${prize}** ödülünü kazandın!` });
            }
        }, 5000);
    },

    // Butona basıldığında çalışacak handler fonksiyonu (Eğer modül yapın butonları destekliyorsa buraya ekleyebilirsin)
    async handleButton(interaction) {
        if (interaction.customId !== 'join_giveaway') return;

        const giveaway = giveaways.get(interaction.message.id);

        if (!giveaway || giveaway.ended) {
            return interaction.reply({ content: '❌ Bu çekiliş sona ermiş!', ephemeral: true });
        }

        if (giveaway.participants.has(interaction.user.id)) {
            giveaway.participants.delete(interaction.user.id);
            
            const oldRow = interaction.message.components[0];
            const newButton = ButtonBuilder.from(oldRow.components[0]).setLabel(`🎉 Çekilişe Katıl (${giveaway.participants.size})`);
            const newRow = new ActionRowBuilder().addComponents(newButton);

            await interaction.message.edit({ components: [newRow] });
            return interaction.reply({ content: '❌ Çekilişten başarıyla çıkış yaptın!', ephemeral: true });
        } else {
            giveaway.participants.add(interaction.user.id);

            const oldRow = interaction.message.components[0];
            const newButton = ButtonBuilder.from(oldRow.components[0]).setLabel(`🎉 Çekilişe Katıl (${giveaway.participants.size})`);
            const newRow = new ActionRowBuilder().addComponents(newButton);

            await interaction.message.edit({ components: [newRow] });
            return interaction.reply({ content: '✅ Başarıyla çekilişe katıldın!', ephemeral: true });
        }
    }
};
