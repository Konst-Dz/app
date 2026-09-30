const miniDataset = {
  code: 'mini',
  language: 'ru',
  title: 'Мини-перевод',
  license: 'Public Domain',
  books: [
    {
      universalId: 1,
      title: 'Бытие',
      shortTitle: 'Быт',
      canonical: true,
      chapters: [
        {
          number: 1,
          verses: [
            { number: 1, text: 'В начале создал Бог небо и землю.' },
            { number: 2, text: 'Земля же была безвидна и пуста.' },
          ],
        },
        {
          number: 2,
          verses: [{ number: 1, text: 'И совершил Бог к седьмому дню дела свои.' }],
        },
        {
          number: 3,
          verses: [{ number: 1, text: 'Змей был хитрее всех зверей полевых.' }],
        },
      ],
    },
    {
      universalId: 67,
      title: '2-я Ездры',
      shortTitle: '2Езд',
      canonical: false,
      chapters: [
        {
          number: 1,
          verses: [{ number: 1, text: 'Светильник света сиял над собранием праведных.' }],
        },
      ],
    },
  ],
};

module.exports = { miniDataset };
