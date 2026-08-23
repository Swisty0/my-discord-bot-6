const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const giveaways = new Map();

function registerCekilisModule(client) {
    client.on('messageCreate', async message => {
        if (message.author.bot) return;

        // .çekiliş komutu kontrolü
        if (message.content.startsWith('.çekiliş')) {
            // Örnek kullanım: .çekiliş 5 1 Nitro
            // arg[1]: süre (dakika), arg[2]: kazanan sayısı, arg[3...]: ödül
            const args = message.content.trim().split(/ +/);
            args.shift(); // .çekiliş kelimesini atla

            const durationMinutes = parseInt(args[0]);
            const winnerCount = parseInt(args[1]);
            const prize = args.slice(2).join(' ');

            if (!durationMinutes || !winnerCount || !prize) {
                return message.reply({ 
                    content: '❌ Hatalı kullanım! Örnek: `.çekiliş [süre_dakika] [kazanan_sayısı] [ödül]`\nÖrnek: `.çekiliş 5 1 Discord Nitro`' 
                });
            }

            // Komut mesajını temizle (isteğe bağlı, şık durması için)
            await message.delete().catch(() => {});

            const endTime = Date.now() + (durationMinutes * 60 * 1000);
            const endsTimestamp = Math.floor(endTime / 1000);

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎉 **ÇEKİLİŞ BAŞLADI!** 🎉')
                .setDescription(`Aşağıdaki butona basarak çekilişe katılabilirsin!\n\n🎁 **Ödül:** **${prize}**\n👑 **Kazanan Sayısı:** \`${winnerCount} Kişi\`\n⏰ **Bitiş Zamanı:** <t:${endsTimestamp}:R>`)
                .setFooter({ text: `${message.author.tag} tarafından düzenleniyor`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp(endTime);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('join_giveaway')
                    .setLabel('🎉 Çekilişe Katıl (0)')
                    .setStyle(ButtonStyle.Primary)
            );

            const msg = await message.channel.send({ embeds: [embed], components: [row] });
            const participants = new Set();

            giveaways.set(msg.id, {
                prize,
                winnerCount,
                participants,
                endTime,
                host: message.author.id,
                ended: false,
                channelId: message.channel.id
            });

            // Süre bitim kontrolü
            const interval = setInterval(async () => {
                const giveaway = giveaways.get(msg.id);
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
                        .setDescription(`🎁 **Ödül:** **${prize}**\n👑 **Kazananlar:** ${winnersText}`)
                        .setTimestamp();

                    const disabledRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('join_giveaway')
                            .setLabel('Çekiliş Sona Erdi')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );

                    await msg.edit({ embeds: [endedEmbed], components: [disabledRow] });
                    await message.channel.send({ content: `🎉 Tebrikler ${winnersText}! **${prize}** ödülünü kazandın!` });
                }
            }, 5000);
        }
    });

    // Buton etkileşimi (Katılma / Çıkma)
    client.on('interactionCreate', async interaction => {
        if (!interaction.isButton() || interaction.customId !== 'join_giveaway') return;

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
    });
}

module.exports = { registerCekilisModule };
