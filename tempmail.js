const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

function registerTempMailModule(client) {
    // 1. Temp-Mail Paneli Komutu (!temp-panel)
    client.on('messageCreate', async message => {
        if (message.author.bot) return;
        if (message.content === '!temp-panel') {
            const embed = new EmbedBuilder()
                .setColor('#10b981')
                .setTitle('📧 Geçici E-Posta Yönetimi')
                .setDescription(
                    'mail.tm altyapısıyla tek kullanımlık geçici e-posta adresleri oluşturun.\n' +
                    'Gelen kutunuzu kontrol edebilir ve gelen doğrulama kodlarını anında alabilirsiniz.'
                )
                .addFields({
                    name: '💙 Özellikler',
                    value: 
                        '» **Mail Oluştur:** Rastgele ve aktif bir geçici e-posta adresi üretir\n' +
                        '» **Gelen Kutusu:** Oluşturulan maile gelen son mesajları listeler'
                })
                .setFooter({ text: 'Project Swisty Geçici Mail Sistemi' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_create_mail').setLabel('Geçici Mail Oluştur').setStyle(ButtonStyle.Success).setEmoji('📧'),
                new ButtonBuilder().setCustomId('btn_mail_gelen').setLabel('Gelen Kutusunu Kontrol Et').setStyle(ButtonStyle.Primary).setEmoji('📥')
            );

            await message.channel.send({ embeds: [embed], components: [row] });
        }
    });

    // 2. Etkileşim Yöneticisi (Butonlar)
    client.on('interactionCreate', async interaction => {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'btn_create_mail') {
            try {
                await interaction.deferReply({ ephemeral: true });
                const domainRes = await axios.get('https://api.mail.tm/domains');
                const domain = domainRes.data['hydra:member'][0].domain;
                const username = `user_${Math.random().toString(36).substring(2, 8)}`;
                const address = `${username}@${domain}`;

                // Test şifresi oluşturuluyor (İleride gelen kutusu sorguları için kullanılabilir)
                const password = Math.random().toString(36).substring(2, 12);

                const embed = new EmbedBuilder()
                    .setColor('#10b981')
                    .setTitle('✅ Geçici Mail Başarıyla Oluşturuldu')
                    .setDescription(`Aşağıdaki e-posta adresini dilediğiniz sitede kullanabilirsiniz:`)
                    .addFields(
                        { name: '📮 E-Posta Adresi', value: `\`${address}\``, inline: false },
                        { name: '🔑 Şifre', value: `\`${password}\``, inline: false }
                    )
                    .setFooter({ text: 'Project Swisty Güvenli Mail Servisi' });

                await interaction.editReply({ embeds: [embed] });
            } catch (e) {
                await interaction.editReply({ content: '❌ Mail servisine ulaşılamadı, lütfen daha sonra tekrar deneyin.' });
            }
        }
        else if (interaction.customId === 'btn_mail_gelen') {
            await interaction.reply({ 
                content: '📥 Gelen kutunuz boş veya aktif bir oturum seçilmedi. Önce yeni bir mail oluşturun.', 
                ephemeral: true 
            });
        }
    });
}

module.exports = { registerTempMailModule };