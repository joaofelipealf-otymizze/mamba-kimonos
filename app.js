/* Mamba Kimonos — ficha de pedido, WhatsApp e fotos reais */
(function () {
  var PHONE = "5584981153296";
  var NB = " ";
  var wa = function (t) { return "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(t); };
  var brl = function (n) { return "R$" + NB + n.toFixed(2).replace(".", ","); };
  var $ = function (id) { return document.getElementById(id); };

  var SIZES = {
    Adulto: ["A0", "A1", "A2", "A3", "A4", "A5"],
    Feminino: ["F1", "F2", "F3", "F4"],
    Infantil: ["M000", "M00", "M0", "M1", "M2", "M3", "M4"]
  };

  var form = $("order");
  var state = { qty: 1, shown: null };
  var root = document.documentElement;
  root.dataset.c = "Branco";

  // links fixos de WhatsApp
  var duvida = wa("Olá, Mamba! Vim pelo site e gostaria de tirar uma dúvida sobre os kimonos.");
  $("wa-acad").href = wa("Olá, Mamba! Vim pelo site e quero consultar um pedido para academia, acima de 5 kimonos. Podemos confirmar modelos, quantidades, personalização, pagamento e prazo?");
  $("wa-duvida").href = duvida;
  $("wa-foot").href = duvida;

  function val(name) { return form.querySelector("input[name=" + name + "]:checked").value; }

  function renderSizes() {
    var box = $("sizes");
    box.innerHTML = "";
    SIZES[val("modelo")].forEach(function (s) {
      var l = document.createElement("label");
      l.innerHTML = '<input type="radio" name="tam" value="' + s + '"><span>' + s + "</span>";
      box.appendChild(l);
    });
    $("nosize").checked = false;
  }

  function basePrice(model, color) {
    if (model === "Infantil") return null;
    return color === "Azul" ? 390 : 350;
  }

  // número que rola até o valor novo
  function roll(el, to, fmt) {
    if (!window.gsap || matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = fmt(to); return; }
    var from = state.shown === null ? to : state.shown;
    var o = { v: from };
    gsap.to(o, { v: to, duration: .7, ease: "power3.out", overwrite: true, onUpdate: function () { el.textContent = fmt(o.v); }, onComplete: function () { el.textContent = fmt(to); } });
  }

  function update() {
    var model = val("modelo");
    var color = val("cor");
    var tam = form.querySelector("input[name=tam]:checked");
    var size = $("nosize").checked ? "" : (tam ? tam.value : "");
    var qty = state.qty;
    var base = basePrice(model, color);

    var lines = [];
    var extras = 0;
    var extraNames = [];
    [["nome", "Nome bordado"], ["patch", "Costura de 3 patches"], ["faixa", "Faixa"]].forEach(function (p) {
      var el = $(p[0]);
      if (el.checked) {
        var v = Number(el.dataset.add);
        extras += v;
        extraNames.push(p[1]);
        lines.push([p[1] + " × " + qty, brl(v * qty)]);
      }
    });
    $("nome-box").classList.toggle("open", $("nome").checked);
    $("faixa-box").classList.toggle("open", $("faixa").checked);

    var total = base === null ? null : (base + extras) * qty;
    if (base !== null) lines.unshift(["Kimono " + color.toLowerCase() + " × " + qty, brl(base * qty)]);
    else lines.unshift(["Kimono infantil × " + qty, "sob consulta"]);

    $("t-title").textContent = model + ", " + color.toLowerCase();
    var sizeTxt = $("nosize").checked ? "Preciso de ajuda com o tamanho" : (size ? "Tamanho " + size : "Escolha seu tamanho");
    $("t-sub").textContent = sizeTxt + " · " + qty + (qty === 1 ? " kimono" : " kimonos");
    $("t-lines").innerHTML = lines.map(function (l) { return "<div><dt>" + l[0] + "</dt><dd>" + l[1] + "</dd></div>"; }).join("");
    if (total === null) { $("t-total").textContent = "Sob consulta"; state.shown = null; }
    else { roll($("t-total"), total, brl); state.shown = total; }
    $("qty").textContent = qty;
    $("academia-hint").hidden = qty <= 5;
    $("minus").disabled = qty <= 1;

    // pagamento: metade antes, metade na entrega
    var payEl = form.querySelector("input[name=pagamento]:checked");
    var pay = payEl ? payEl.value : "";
    var half = total === null ? null : total / 2;
    $("pay-in").innerHTML = half === null ? "sob consulta" : brl(half);
    $("pay-out").innerHTML = half === null ? "sob consulta" : brl(half);
    var payTxt = pay ? (pay === "Cartão" ? "Cartão (com juros)" : "Pix") : "";
    $("t-pay").textContent = !pay ? "Escolha a forma de pagamento." :
      (half === null ? payTxt + ": 50% de entrada e 50% na entrega." : payTxt + ": " + brl(half) + " antes e " + brl(half) + " na entrega.");

    // entrega
    var cidade = $("cidade").value.trim();
    var livre = /natal|goianinha/i.test(cidade);
    $("cidade-hint").textContent = !cidade ? "Em Natal e em Goianinha a entrega é grátis. Para outras cidades, a gente informa frete e prazo." :
      (livre ? "Entrega grátis para " + cidade + "." : "Para " + cidade + ", a gente informa frete e prazo no atendimento.");

    var nomeTxt = $("nome-txt").value.trim();
    var faixaTxt = $("faixa-cor").value.trim();
    var obs = $("obs").value.trim();
    var msg = "Olá, Mamba! Vim pelo site e quero fazer um pedido.\n\n" +
      "Modelo: " + model + "\n" +
      "Cor: " + color + "\n" +
      "Tamanho: " + ($("nosize").checked ? "ainda não sei, preciso de ajuda" : (size || "a definir")) + "\n" +
      "Quantidade: " + qty + "\n" +
      "Personalização: " + (extraNames.length ? extraNames.join(", ") : "nenhuma") + "\n" +
      ($("nome").checked ? "Nome a bordar: " + (nomeTxt || "a definir") + "\n" : "") +
      ($("faixa").checked ? "Cor da faixa: " + (faixaTxt || "a definir") + "\n" : "") +
      "Estimativa: " + (total === null ? "valor sob consulta" : brl(total)) + "\n" +
      "Forma de pagamento: " + (payTxt || "a combinar") + (half === null ? "" : " (50% de entrada: " + brl(half) + " e 50% na entrega: " + brl(half) + ")") + "\n" +
      (cidade ? "Cidade: " + cidade + "\n" : "") +
      (obs ? "Observação: " + obs + "\n" : "") +
      (qty > 5 ? "\nSão mais de 5 unidades: queria saber a condição para academia.\n" : "");
    $("msg").textContent = msg;
    $("wa").href = wa(msg);
  }

  // cor: uma só verdade para o palco, o fundo do pedido e a ficha
  function setColor(name, fromForm) {
    if (!name) return;
    root.dataset.c = name;
    if (!fromForm) {
      var r = form.querySelector('input[name=cor][value="' + name + '"]');
      if (r) r.checked = true;
      update();
    }
    document.dispatchEvent(new CustomEvent("mamba:color", { detail: name }));
  }
  // tamanho escolhido na ficha técnica: já marca na ficha de pedido e leva até ela
  function pickSize(model, size) {
    var m = form.querySelector('input[name=modelo][value="' + model + '"]');
    if (m && !m.checked) { m.checked = true; renderSizes(); }
    var t = form.querySelector('input[name=tam][value="' + size + '"]');
    if (t) { t.checked = true; $("nosize").checked = false; }
    update();
    var target = $("pedido");
    if (window.mamba && window.mamba.scrollTo) window.mamba.scrollTo(target);
    else target.scrollIntoView({ behavior: "smooth" });
    if (t) {
      var chip = t.nextElementSibling;
      chip.classList.remove("pulse"); void chip.offsetWidth; chip.classList.add("pulse");
    }
  }
  document.querySelectorAll(".size-group button").forEach(function (b) {
    b.addEventListener("click", function () { pickSize(b.dataset.model, b.dataset.size); });
  });
  // só visual (rolagem do palco): não mexe na escolha da ficha
  function preview(name) { root.dataset.c = name; document.dispatchEvent(new CustomEvent("mamba:color", { detail: name })); }
  function formColor() { return val("cor"); }
  window.mamba = { setColor: setColor, pickSize: pickSize, preview: preview, formColor: formColor };

  form.addEventListener("change", function (e) {
    if (e.target.name === "modelo") renderSizes();
    if (e.target.name === "cor") setColor(e.target.value, true);
    if (e.target.id === "nosize" && e.target.checked) {
      var t = form.querySelector("input[name=tam]:checked");
      if (t) t.checked = false;
    }
    if (e.target.name === "tam") $("nosize").checked = false;
    update();
  });
  form.addEventListener("input", update);
  $("plus").addEventListener("click", function () { state.qty = Math.min(state.qty + 1, 50); update(); });
  $("minus").addEventListener("click", function () { state.qty = Math.max(state.qty - 1, 1); update(); });
  form.addEventListener("submit", function (e) { e.preventDefault(); });

  // perguntas frequentes (acordeão)
  document.querySelectorAll(".acc button").forEach(function (b) {
    b.addEventListener("click", function () {
      var acc = b.closest(".acc");
      var open = !acc.classList.contains("open");
      acc.classList.toggle("open", open);
      b.setAttribute("aria-expanded", open ? "true" : "false");
      if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 560);
    });
  });

  // Fotos reais: basta colocar o arquivo em assets/ com um destes nomes.
  // Se o arquivo existir, o site troca sozinho. Se não existir, fica a imagem atual.
  function tryImage(src, ok) { var im = new Image(); im.onload = function () { ok(src); }; im.src = src; }
  var reais = 0;
  ["Branco", "Preto", "Azul"].forEach(function (c) {
    tryImage("assets/foto-" + c.toLowerCase() + ".jpg", function (src) {
      document.querySelectorAll('[data-kimono="' + c + '"]').forEach(function (img) {
        img.src = src;
        if (img.alt) img.alt = "Kimono " + c.toLowerCase() + " Mamba";
      });
      reais++;
      if (reais === 3) { var n = $("nota-ilustrativa"); if (n) n.textContent = "Faixa vendida à parte (R$" + NB + "70). Infantil (M000 a M4): valor sob consulta."; }
    });
  });
  tryImage("assets/foto-producao.jpg", function (src) {
    var slot = $("foto-producao");
    if (!slot) return;
    var im = document.createElement("img");
    im.src = src; im.alt = "Produção dos kimonos Mamba em Goianinha"; im.className = "photo-real";
    slot.replaceWith(im);
  });

  renderSizes();
  update();
})();
