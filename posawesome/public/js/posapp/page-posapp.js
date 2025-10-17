!function(e, t) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t()) : e.onScan = t()
}(this, function() {
    var d = {
        attachTo: function(e, t) {
            if (void 0 !== e.scannerDetectionData)
                throw new Error("onScan.js is already initialized for DOM element " + e);
            var n = {
                onScan: function(e, t) {},
                onScanError: function(e) {},
                onKeyProcess: function(e, t) {},
                onKeyDetect: function(e, t) {},
                onPaste: function(e, t) {},
                keyCodeMapper: function(e) {
                    return d.decodeKeyEvent(e)
                },
                onScanButtonLongPress: function() {},
                scanButtonKeyCode: !1,
                scanButtonLongPressTime: 500,
                timeBeforeScanTest: 100,
                avgTimeByChar: 30,
                minLength: 6,
                suffixKeyCodes: [9, 13],
                prefixKeyCodes: [],
                ignoreIfFocusOn: !1,
                stopPropagation: !1,
                preventDefault: !1,
                captureEvents: !1,
                reactToKeydown: !0,
                reactToPaste: !1,
                singleScanQty: 1
            };
            return t = this._mergeOptions(n, t),
            e.scannerDetectionData = {
                options: t,
                vars: {
                    firstCharTime: 0,
                    lastCharTime: 0,
                    accumulatedString: "",
                    testTimer: !1,
                    longPressTimeStart: 0,
                    longPressed: !1
                }
            },
            !0 === t.reactToPaste && e.addEventListener("paste", this._handlePaste, t.captureEvents),
            !1 !== t.scanButtonKeyCode && e.addEventListener("keyup", this._handleKeyUp, t.captureEvents),
            !0 !== t.reactToKeydown && !1 === t.scanButtonKeyCode || e.addEventListener("keydown", this._handleKeyDown, t.captureEvents),
            this
        },
        detachFrom: function(e) {
            e.scannerDetectionData.options.reactToPaste && e.removeEventListener("paste", this._handlePaste),
            !1 !== e.scannerDetectionData.options.scanButtonKeyCode && e.removeEventListener("keyup", this._handleKeyUp),
            e.removeEventListener("keydown", this._handleKeyDown),
            e.scannerDetectionData = void 0
        },
        getOptions: function(e) {
            return e.scannerDetectionData.options
        },
        setOptions: function(e, t) {
            switch (e.scannerDetectionData.options.reactToPaste) {
            case !0:
                !1 === t.reactToPaste && e.removeEventListener("paste", this._handlePaste);
                break;
            case !1:
                !0 === t.reactToPaste && e.addEventListener("paste", this._handlePaste)
            }
            switch (e.scannerDetectionData.options.scanButtonKeyCode) {
            case !1:
                !1 !== t.scanButtonKeyCode && e.addEventListener("keyup", this._handleKeyUp);
                break;
            default:
                !1 === t.scanButtonKeyCode && e.removeEventListener("keyup", this._handleKeyUp)
            }
            return e.scannerDetectionData.options = this._mergeOptions(e.scannerDetectionData.options, t),
            this._reinitialize(e),
            this
        },
        decodeKeyEvent: function(e) {
            var t = this._getNormalizedKeyNum(e);
            switch (!0) {
            case 48 <= t && t <= 90:
            case 106 <= t && t <= 111:
                if (void 0 !== e.key && "" !== e.key)
                    return e.key;
                var n = String.fromCharCode(t);
                switch (e.shiftKey) {
                case !1:
                    n = n.toLowerCase();
                    break;
                case !0:
                    n = n.toUpperCase()
                }
                return n;
            case 96 <= t && t <= 105:
                return t - 96
            }
            return ""
        },
        simulate: function(e, t) {
            return this._reinitialize(e),
            Array.isArray(t) ? t.forEach(function(e) {
                var t = {};
                "object" != typeof e && "function" != typeof e || null === e ? t.keyCode = parseInt(e) : t = e;
                var n = new KeyboardEvent("keydown",t);
                document.dispatchEvent(n)
            }) : this._validateScanCode(e, t),
            this
        },
        _reinitialize: function(e) {
            var t = e.scannerDetectionData.vars;
            t.firstCharTime = 0,
            t.lastCharTime = 0,
            t.accumulatedString = ""
        },
        _isFocusOnIgnoredElement: function(e) {
            var t = e.scannerDetectionData.options.ignoreIfFocusOn;
            if (!t)
                return !1;
            var n = document.activeElement;
            if (Array.isArray(t)) {
                for (var a = 0; a < t.length; a++)
                    if (!0 === n.matches(t[a]))
                        return !0
            } else if (n.matches(t))
                return !0;
            return !1
        },
        _validateScanCode: function(e, t) {
            var n, a = e.scannerDetectionData, i = a.options, o = a.options.singleScanQty, r = a.vars.firstCharTime, s = a.vars.lastCharTime, c = {};
            switch (!0) {
            case t.length < i.minLength:
                c = {
                    message: "Receieved code is shorter then minimal length"
                };
                break;
            case s - r > t.length * i.avgTimeByChar:
                c = {
                    message: "Receieved code was not entered in time"
                };
                break;
            default:
                return i.onScan.call(e, t, o),
                n = new CustomEvent("scan",{
                    detail: {
                        scanCode: t,
                        qty: o
                    }
                }),
                e.dispatchEvent(n),
                d._reinitialize(e),
                !0
            }
            return c.scanCode = t,
            c.scanDuration = s - r,
            c.avgTimeByChar = i.avgTimeByChar,
            c.minLength = i.minLength,
            i.onScanError.call(e, c),
            n = new CustomEvent("scanError",{
                detail: c
            }),
            e.dispatchEvent(n),
            d._reinitialize(e),
            !1
        },
        _mergeOptions: function(e, t) {
            var n, a = {};
            for (n in e)
                Object.prototype.hasOwnProperty.call(e, n) && (a[n] = e[n]);
            for (n in t)
                Object.prototype.hasOwnProperty.call(t, n) && (a[n] = t[n]);
            return a
        },
        _getNormalizedKeyNum: function(e) {
            return e.which || e.keyCode
        },
        _handleKeyDown: function(e) {
            var t = d._getNormalizedKeyNum(e)
              , n = this.scannerDetectionData.options
              , a = this.scannerDetectionData.vars
              , i = !1;
            if (!1 !== n.onKeyDetect.call(this, t, e) && !d._isFocusOnIgnoredElement(this))
                if (!1 === n.scanButtonKeyCode || t != n.scanButtonKeyCode) {
                    switch (!0) {
                    case a.firstCharTime && -1 !== n.suffixKeyCodes.indexOf(t):
                        e.preventDefault(),
                        e.stopImmediatePropagation(),
                        i = !0;
                        break;
                    case !a.firstCharTime && -1 !== n.prefixKeyCodes.indexOf(t):
                        e.preventDefault(),
                        e.stopImmediatePropagation(),
                        i = !1;
                        break;
                    default:
                        var o = n.keyCodeMapper.call(this, e);
                        if (null === o)
                            return;
                        a.accumulatedString += o,
                        n.preventDefault && e.preventDefault(),
                        n.stopPropagation && e.stopImmediatePropagation(),
                        i = !1
                    }
                    a.firstCharTime || (a.firstCharTime = Date.now()),
                    a.lastCharTime = Date.now(),
                    a.testTimer && clearTimeout(a.testTimer),
                    i ? (d._validateScanCode(this, a.accumulatedString),
                    a.testTimer = !1) : a.testTimer = setTimeout(d._validateScanCode, n.timeBeforeScanTest, this, a.accumulatedString),
                    n.onKeyProcess.call(this, o, e)
                } else
                    a.longPressed || (a.longPressTimer = setTimeout(n.onScanButtonLongPress, n.scanButtonLongPressTime, this),
                    a.longPressed = !0)
        },
        _handlePaste: function(e) {
            if (!d._isFocusOnIgnoredElement(this)) {
                e.preventDefault(),
                oOptions.stopPropagation && e.stopImmediatePropagation();
                var t = (event.clipboardData || window.clipboardData).getData("text");
                this.scannerDetectionData.options.onPaste.call(this, t, event);
                var n = this.scannerDetectionData.vars;
                n.firstCharTime = 0,
                n.lastCharTime = 0,
                d._validateScanCode(this, t)
            }
        },
        _handleKeyUp: function(e) {
            d._isFocusOnIgnoredElement(this) || d._getNormalizedKeyNum(e) == this.scannerDetectionData.options.scanButtonKeyCode && (clearTimeout(this.scannerDetectionData.vars.longPressTimer),
            this.scannerDetectionData.vars.longPressed = !1)
        },
        isScanInProgressFor: function(e) {
            return 0 < e.scannerDetectionData.vars.firstCharTime
        }
    };
    return d
});
frappe.pages['posapp'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'POS Awesome',
        single_column: true
    });

    this.page.$PosApp = new frappe.PosApp.posapp(this.page);

    $('div.navbar-fixed-top').find('.container').css('padding', '0');

    $("head").append("<link href='/assets/posawesome/node_modules/vuetify/dist/vuetify.min.css' rel='stylesheet'>");
    $("head").append("<link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/@mdi/font@6.x/css/materialdesignicons.min.css'>");
    $("head").append("<link rel='stylesheet' href='https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900' />");
}
;

//Only if PT as we are not being able to load from pt.csv
if (frappe.boot.lang == "pt") {
    $.extend(__messages, {
        "Type": "Tipo",
        "is Offer": "é Oferta",
        "Total Qty": "Qtd Total",
        "Customer": "Cliente",
        "Items Group": "Grupo de Itens",
        "Search Items": "Procurar Itens",
        "Additional Discount": "Desconto Adicional",
        "Items Discounts": "Descontos de Itens",
        "HOLD": "EM PAUSA",
        "Hold": "Em Pausa",
        "RETURN": "DEVOLUÇÃO",
        "Return": "Devolução",
        "CANCEL": "CANCELAR",
        "NEW": "NOVO",
        "PAY": "PAGAR",
        "Order": "Ordem",
        "Available QTY": "QTD Disponivel",
        "QTY": "QTD",
        "Discount Percentage": "Percentagem de Desconto",
        "Price list Rate": "Taxa de Lista de Preço",
        "Group": "Grupo",
        "Stock QTY": "QTD de Stock",
        "Stock UOM": "UDM de Stock",
        "Card": "Cartão",
        "Offers": "Ofertas",
        "Applied": "Aplicadas",
        "There is no Customer !": "Não tem Cliente !",
        "There is no Items !": "Não tem Itens !",
        "The existing quantity of item {0} is not enough": "A quantidade existente do item {0} não é suficiente",
        "Maximum discount for Item {0} is {1}%": "Desconto Maximo para o Item {0} é {1}%",
        "Selected serial numbers of item {0} is incorrect": "Numeros de serie selecionado do item {0} é incorrecto",
        "The existing batch quantity of item {0} is not enough": "A quantidade existente do lote para o item {0} não é suficiente",
        "The discount should not be higher than {0}%": "O desconto não deve ser maior que {0}%",
        "Return Invoice Total Not Correct": "Total da Devolução da Factura não está Correcto",
        "Return Invoice Total should not be higher than {0}": "Total da Devolução da Factura não deve maior que {0}",
        "The item {0} cannot be returned because it is not in the invoice {1}": "O item {0} não pode ser devolvido porque não está na factura {1}",
        "The QTY of the item {0} cannot be greater than {1}": "A QTD do item {0} não pode ser maior que {1}",
        "Selected Serial No QTY is {0} it should be {1}": "A QTD selecionada do Num. de Serie é {0} deveria ser {1}",
        "Loyalty Point Offer Applied": "Oferta de Pontos de Lealdade Aplicada",
        "Loyalty Points": "Pontos de Lealdade",
        "Paid Amount": "Valor Pago",
        "To Be Paid": "A ser Pago",
        "Cash": "Numerário",
        "Tax and Charges": "Taxas e Impostos",
        "Discount Amount": "Valor de Desconto",
        "Total Amount": "Valor Total",
        "Totoal Amount": "Valor Total",
        "Grand Amount": "Total Geral",
        "Back": "Voltar",
        "Submit Payments": "Submeter Pagamentos",
        "Give Item": "Entregar Item",
        "New Offer Available": "Nova Oferta Disponivel",
        "POS Offers": "Ofertas POS",
        "Customer contact created successfully.": "Contacto de Cliente criado com sucesso.",
        "Customer Address created successfully.": "Endereço de Cliente criado com sucesso.",
        "Customer contact updated successfully.": "Contacto de Cliente actualizacdo com sucesso.",
        "Offer": "Oferta",
        "Apply On": "Aplicar Em",
        "Offer Applied": "Oferta Aplicada",
        "Opening Amount": "Valor de Abertura",
        "Closing Amount": "Valor de Fecho",
        "Expected Amount": "Valor Esperado",
        "Difference": "Diferença",
        "Close": "Fechar",
        "Submit": "Submeter",
        "Closing POS Shift": "Fechando Turno do POS",
        "Select Hold Invoice": "Selecionar Factura em Pausa",
        "Customer Info": "Info do Cliente",
        "Add New Address": "Adicionar Novo Endereço",
        "New Customer": "Novo Cliente",
        "Create POS Opening Shift": "Criar Turno de Abertura POS",
        "Select Return Invoice": "Selecione a Factura para Devolução",
        "Close Shift": "Fechar Turno",
        "Pages": "Paginas",
        "Customer not found": "Cliente não encontrado",
        "Customer Name": "Nome do Cliente",
        "Batch No Available QTY": "QTD Disponivel para o Lote",
        "Batch No Expiry Date": "Data de Expiração do Lote",
        "Batch No": "Num. do Lote",
        "Use Customer Credit": "Usar Crédito Cliente",
        "Is Credit Sale": "É Venda a Crédito",
        "Due Date": "Data de Expiração",
    });
}

//# sourceURL=posapp.js
