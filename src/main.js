import App from './App.svelte';

windows.itd_basket = new App({
	target: document.getElementById('b-vincko-basket-component'),
	props: {
		items: [{
			id: null,
			title: 'Комплект оборудования',
			name1: 'Премиум',
			name2: 'AJAX SmartHome'
		},
		{
			id: null,
			title: 'Охранная компания',
			name1: '12 месяев обслуживания',
			name2: 'ООО “Зубряков Охрана Компания Ва'
		}
		]
	}
});

export default app;