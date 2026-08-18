const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

function registerListDmModule(client) {
    // 1. Liste & Arkadaş DM Paneli Komutu (!list)
    client.on('messageCreate', async message => {
        if (message.author.bot) return;
        if (message.content === '!list') {
            const embed = new EmbedBuilder()
                .setColor('#ef4444')
                .setTitle('📩 Arkadaş DM ve Liste Sistemi')
                .setDescription(
                    'Seçtiğiniz hesabın arkadaş listesindeki kullanıcılara toplu ve güvenli bir şekilde özel mesaj (DM) gönderin.'
                )
                .addFields({
                    name: '💙 Seçenekler',
                    value: 
                        '» **DM Gönder:** Aktif hesap listesinden seçim yaparak arkadaşlara toplu mesaj kuyruğu başlatır'
                })
                .setFooter({ text: 'Project Swisty Arkadaş DM Sistemi' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_list_dm').setLabel('Arkadaşlara DM Gönder').setStyle(ButtonStyle.Success).setEmoji('➕')
            );

            await message.channel.send({ embeds: [embed], components: [row] });
        }
    });

    // 2. Etkileşim Yöneticisi (Buton, Menü ve Modal)
    client.on('interactionCreate', async interaction => {
        if (interaction.isButton() && interaction.customId === 'btn_list_dm') {
            const embed = new EmbedBuilder()
                .setColor('#3b82f6')
                .setTitle('👥 Hesap Seçimi Gerekiyor')
                .setDescription('Lütfen işlem yapmasını istediğiniz kayıtlı hesabınızı seçin:');

            // Not: Hesap havuzu ortak kullanılabilir veya örnek menü sunulabilir
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_list_hesap')
                .setPlaceholder('🚀 DM gönderecek hesabı seçiniz...')
                .addOptions({ label: 'Varsayılan Hesap / Havuz', value: 'default_account' });

            await interaction.reply({ 
                embeds: [embed], 
                components: [new ActionRowBuilder().addComponents(selectMenu)], 
                ephemeral: true 
            });
        }
        else if (interaction.isStringSelectMenu() && interaction.customId === 'select_list_hesap') {
            const modal = new ModalBuilder().setCustomId('modal_list_gonder').setTitle('Arkadaşlara DM Metni');
            
            const mesaj = new TextInputBuilder()
                .setCustomId('input_dm_metni')
                .setLabel('Gönderilecek Mesaj')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(mesaj));
            await interaction.showModal(modal);
        }
        else if (interaction.isModalSubmit() && interaction.customId === 'modal_list_gonder') {
            const text = interaction.fields.getTextInputValue('input_dm_metni');
            
            await interaction.reply({ 
                content: `📩 **Project Swisty:** Arkadaş listesine toplu DM gönderim kuyruğu başarıyla başlatıldı!\n\n• **Mesaj:** \`${text}\``, 
                ephemeral: true 
            });
        }
    });
}

module.exports = { registerListDmModule };
