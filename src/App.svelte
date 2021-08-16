<script>
    export let items;
    export let sum;
    export let old_sum;
    export let subscribe_sum;
    export let isAuthorized;

    function handleBuy(paymentMethod) {

        const url = '/ajax/addtobasket.php';
        var formData = new FormData();
        var data = {
            'paymentMethod': paymentMethod,
            'items': items,
            'total': {'total_sum': sum, 'total_old_sum': old_sum, 'total_subscribe_sum': subscribe_sum}
        };
        formData.append('data', JSON.stringify(data));

        fetch(url, {method: 'POST', body: formData})
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                }
            })
            .catch(function (err) {
                console.info(err + " url: " + url);
            });
    }

</script>

<div class="solutions__bottom">
    <div class="container">
        <div class="solutions__bottom_title">
            Итого, в ваше Готовое решение входит:
        </div>
        <div class="solutions__bottom_wrapper">
            <div class="solutions__bottom_left">
                {#each items as row}
                    {#if row.active}
                        <div class="solutions__bottom_row">
                            <p class="solutions__bottom_row-left">{row.title}</p>
                            <div class="solutions__bottom_row-center">
                                <span>{row.name1}</span>
                                <span>{row.name2}</span>
                            </div>
                            <div class="solutions__bottom_row-right">
                                <span>{row.gift}</span>
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
            <div class="solutions__bottom_right">
                <div class="solutions__bottom_column">
                    <div class="solutions__bottom_column-title">
                        Всего
                    </div>
                    <div class="solutions__bottom_column-oldprice">
                        {old_sum} ₽
                    </div>
                    <div class="solutions__bottom_column-newprice">
                        {sum} ₽
                    </div>
                    {#if isAuthorized}
                        <button on:click="{() => handleBuy('card')}"
                                class="solutions__bottom_column-btn grey">
                            купить
                        </button>
                    {:else}
                        <button on:click="{() => handleBuy('card')}" class="js-modal js-modal-auth solutions__bottom_column-btn grey">
                            купить
                        </button>
                    {/if}
                </div>
                <div class="solutions__bottom_column">
                    <div class="solutions__bottom_column-title">
                        Рассрочка без процентов
                    </div>
                    <div class="solutions__bottom_column-interest">
                        <p>все проценты<br>
                            за вас платит <span>vincko:</span>
                        </p>
                    </div>
                    <div class="solutions__bottom_column-monthprice">
                        <div class="solutions__bottom_column-select">
                            12 мес.
                        </div>
                        <p>по</p>
                        <div class="solutions__bottom_column-price">
                            1 000 ₽
                        </div>
                    </div>
                    {#if isAuthorized}
                        <button on:click="{() => handleBuy('installment')}"
                                class="solutions__bottom_column-btn yellow">
                            В рассрочку
                        </button>
                    {:else}
                        <button class="js-modal js-modal-auth solutions__bottom_column-btn yellow">
                            В рассрочку
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
