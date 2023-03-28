"use strict";
!(function () {
  var pageNo = 1,
    localData = {
      purchPrice: 2e5,
      equity: 0,
      valueDevPA: 2,
      repaymentPA: 2,
      runtime: 10,
      equityCOPY: 0,
      incidentalPurchaseCosts: 0,
      markerFee: 0,
      otherOnetime: 0,
      interest: 333,
      interestPercent: 2,
      repayment: 333,
      repaymentPACOPY: 2,
      rental_management: 30,
      property_management: 30,
      maintenance_reserve: 0,
      otherMonthly: 0,
      rent: 0,
      rentIncrease: 0,
      taxAdvantage: 0,
    },
    moneyFormatter = new Intl.NumberFormat("de-DE", {
      maximumFractionDigits: 2,
    });
  function updateLocalSession(id, val) {
    id &&
      ((localData[id] = parseFloat(val)),
      localStorage.setItem("dm-real-cal", JSON.stringify(localData)));
  }
  function calculateNewValues() {
    var interestAndRepayment = 0,
      interestAndRepayment = this
        ? ((function (element) {
            switch (element.id) {
              case "equity":
                el(element.id + "COPY").value = element.value;
                break;
              case "equityCOPY":
                el("equity").value = element.value;
                break;
              case "repaymentPA":
                el(element.id + "COPY").value = element.value;
                break;
              case "repaymentPACOPY":
                el("repaymentPA").value = element.value;
            }
          })(this),
          calculateInterestAndRepayment(this))
        : calculateInterestAndRepayment(),
      purchPrice = el("purchPrice").value,
      assetBuilding = el("valueDevPA").value,
      interestPercent = el("interestPercent").value,
      runtime = el("runtime").value,
      equity = el("equity").value,
      assetBuilding = Math.round(
        purchPrice * Math.pow(1 + 0.01 * assetBuilding, runtime)
      );
    el("newValue").innerHTML = moneyFormatter.format(assetBuilding) + "€";
    for (var remain = purchPrice - equity, m = 0; m < 12 * runtime; ++m)
      remain -= Math.round(
        interestAndRepayment - remain * ((0.01 * interestPercent) / 12)
      );
    el("remain").innerHTML = moneyFormatter.format(remain) + "€";
    assetBuilding = Math.round(assetBuilding - remain);
    (el("assetBuilding").innerHTML =
      moneyFormatter.format(assetBuilding) + "€"),
      remain <= 0
        ? $(".nev-img,.nev-img-1").show()
        : $(".nev-img,.nev-img-1").hide(),
      $(".assetBuildingCOPY").html(moneyFormatter.format(assetBuilding)),
      $(".assetBuildingCOPYMonth").html(
        moneyFormatter.format(Math.round(assetBuilding / runtime / 12))
      );
    !(function (interestAndRepayment) {
      var runtime = parseInt(el("taxAdvantage").value),
        rent = parseInt(el("rent").value),
        rentIncrease = el("rentIncrease").value,
        interest = parseInt(el("interest").value),
        repayment = parseInt(el("repayment").value),
        rental_management = parseInt(el("rental_management").value),
        property_management = parseInt(el("property_management").value),
        totalExpenses = parseInt(el("maintenance_reserve").value),
        otherMonthly = parseInt(el("otherMonthly").value),
        runtime = Math.round(runtime + rent);
      el("totalRevenues").innerHTML = moneyFormatter.format(runtime);
      totalExpenses = Math.round(
        interest +
          repayment +
          rental_management +
          otherMonthly +
          property_management +
          totalExpenses
      );
      el("totalExpenses").innerHTML = moneyFormatter.format(totalExpenses);
      var ownExpensesMonthly = Math.round(totalExpenses - runtime);
      (el("ownExpensesMonthly").innerHTML =
        moneyFormatter.format(ownExpensesMonthly)),
        (el("rentIncreaseDiv").innerHTML = "");
      runtime = parseInt(el("runtime").value);
      if (3 <= runtime && 0 < rentIncrease) {
        for (
          var rentIncreaseFrequency = Math.floor(runtime / 3),
            rentIncreaseDivHtml = "",
            m = 0;
          m < rentIncreaseFrequency;
          m++
        ) {
          var rentIncreaseDivNum = Math.round(
            ownExpensesMonthly +
              rent -
              rent * Math.pow(1 + 0.01 * rentIncrease, m + 1)
          );
          rentIncreaseDivHtml += "<span >nach <b>"
            .concat(3 * (m + 1), "</b> Jahren: <b>")
            .concat(
              moneyFormatter.format(rentIncreaseDivNum),
              " €</b></span>"
            );
        }
        el("rentIncreaseDiv").innerHTML = rentIncreaseDivHtml;
      }
      (function (interestAndRepayment) {
        parseInt(el("ownExpensesMonthly").innerHTML.replaceAll(".", ""));
        var incidentalPurchaseCosts = parseInt(
            el("incidentalPurchaseCosts").value
          ),
          equity = parseInt(el("equity").value),
          markerFee = parseInt(el("markerFee").value),
          sumOwnExpenses = parseInt(el("otherOnetime").value),
          runtime = parseInt(el("runtime").value),
          pct = parseInt(el("assetBuilding").innerHTML.replaceAll(".", "")),
          rent = parseInt(el("rent").value),
          rentIncrease = el("rentIncrease").value,
          sumOwnRevenues = parseInt(el("taxAdvantage").value),
          rental_management = parseInt(el("rental_management").value),
          property_management = parseInt(el("property_management").value),
          maintenance_reserve = parseInt(el("maintenance_reserve").value),
          otherMonthly = parseInt(el("otherMonthly").value),
          sumOwnExpenses10Years = (function () {
            for (var e = 12 * rent, t = 0, a = 0; a < runtime; ++a)
              (t += e), a % 3 == 0 && (e *= 1 + rentIncrease / 100);
            return t;
          })(),
          sumOwnRevenues =
            sumOwnExpenses +
            markerFee +
            incidentalPurchaseCosts +
            equity +
            12 *
              (interestAndRepayment +
                rental_management +
                otherMonthly +
                property_management +
                maintenance_reserve -
                sumOwnRevenues) *
              runtime -
            sumOwnExpenses10Years,
          sumOwnExpenses10Years = Math.round(
            sumOwnRevenues -
              (sumOwnExpenses + markerFee + incidentalPurchaseCosts + equity)
          );
        (el("sumOwnExpenses10Years").innerHTML = moneyFormatter.format(
          sumOwnExpenses10Years
        )),
          $(".runtimeCOPY").html(runtime),
          (el("year-reanger").value = runtime),
          1 == parseInt(runtime)
            ? $(".year-txt").html("Jahr")
            : $(".year-txt").html("Jahre");
        (el("equityCOPY2").innerHTML = moneyFormatter.format(equity)),
          (el("incidentalPurchaseCostsCOPY").innerHTML = moneyFormatter.format(
            incidentalPurchaseCosts
          )),
          (el("markerFeeCOPY").innerHTML = moneyFormatter.format(markerFee)),
          (el("otherOnetimeCOPY").innerHTML =
            moneyFormatter.format(sumOwnExpenses));
        sumOwnExpenses =
          sumOwnExpenses10Years +
          equity +
          incidentalPurchaseCosts +
          markerFee +
          sumOwnExpenses;
        $(".sumOwnExpenses").html(moneyFormatter.format(sumOwnExpenses)),
          $(".sumOwnExpensesMonth").html(
            moneyFormatter.format(sumOwnExpenses / runtime / 12)
          ),
          sumOwnRevenues < 0 && (sumOwnRevenues *= -1);
        sumOwnRevenues = Math.round(
          ((pct - sumOwnRevenues) / (12 * runtime)) * runtime * 12
        );
        $(".sumOwnRevenues").html(
          0 < sumOwnRevenues ? moneyFormatter.format(sumOwnRevenues) : 0
        );
        pct = Math.abs(Math.round(100 * (pct / sumOwnExpenses - 1)));
        (el("returnOfEquity").innerHTML = pct),
          (el("returnOfEquityMonth").innerHTML = Math.round(pct / runtime));
        (pct = parseFloat(
          $(".sumOwnExpensesMonth").html().replaceAll(".", "").replace(",", ".")
        )),
          (pct =
            ((parseFloat(
              $(".assetBuildingCOPYMonth")
                .html()
                .replaceAll(".", "")
                .replace(",", ".")
            ) -
              pct) /
              pct) *
            100);
        $(".monthlyReturn").html(moneyFormatter.format(pct));
      })(interestAndRepayment);
    })(interestAndRepayment);
  }
  function calculateInterestAndRepayment(element) {
    var purchPrice = el("purchPrice").value,
      equity = el("equity").value,
      repayment = el("repayment").value,
      repaymentPA = el("repaymentPA").value,
      interest = el("interest").value,
      interestPercent = el("interestPercent").value;
    return (
      element && "interestPercent" != element.id && "interest" == element.id
        ? (interestPercent = ((12 * interest) / (purchPrice - equity)) * 100)
        : (interest = Math.round(
            ((purchPrice - equity) * interestPercent * 0.01) / 12
          )),
      element &&
      "repaymentPA" != element.id &&
      "repaymentPACOPY" != element.id &&
      "repayment" == element.id
        ? (repaymentPA = ((12 * repayment) / (purchPrice - equity)) * 100)
        : (repayment = Math.round(
            ((purchPrice - equity) * repaymentPA * 0.01) / 12
          )),
      (el("repayment").value = repayment),
      (el("repaymentPA").value = moneyFormatter
        .format(repaymentPA)
        .replace(",", ".")),
      (el("repaymentPACOPY").value = moneyFormatter
        .format(repaymentPA)
        .replace(",", ".")),
      (el("interest").value = interest),
      (el("interestPercent").value = moneyFormatter
        .format(interestPercent)
        .replace(",", ".")),
      Math.round(parseInt(repayment) + parseInt(interest))
    );
  }
  function indicatorPress() {
    (pageNo = parseInt($(this).parent().attr("data-no"))), slidePage();
  }
  function buttonPress() {
    var tag = $(this).attr("data-tag");
    "+" == tag && pageNo < 4 ? pageNo++ : "-" == tag && 1 < pageNo && pageNo--,
      slidePage();
  }
  function el(id) {
    var el = document.getElementById(id);
    if (!el) {
      return returnFallback(id);
    }
    return el;
  }
  
  function elq(selector) {
    var el = document.querySelector(selector);
    if (!el) {
      return returnFallback(selector);
    }
    return el;
  }
  function slidePage() {
    $(".page-2").hide(),
      $(".page-3").hide(),
      $(".page-4").hide(),
      $(".pn-button").addClass("pn-button--active"),
      $(".pn-indicator").removeClass("pn-indicator--active"),
      $('.pn-indicator[data-no="'.concat(pageNo, '"]')).addClass(
        "pn-indicator--active"
      ),
      1 == pageNo
        ? ($(".page-1").removeClass("page-1-trans"),
          $('.pn-button[data-tag="-"]').removeClass("pn-button--active"))
        : ($(".page-1").addClass("page-1-trans"),
          $(".page-" + pageNo).show(),
          4 == pageNo &&
            $('.pn-button[data-tag="+"]').removeClass("pn-button--active"));
  }
  function initCanvas() {
    var _r,
      _i,
      _c,
      _g_x,
      _g_y,
      d_x,
      d_y,
      p_x,
      p_y,
      h_x,
      h_y,
      sWidth_width = window.innerWidth,
      canvas = (window.innerHeight, document.querySelector(".page-1__bg")),
      cntx = document.querySelector(".page-1__grid");
    canvas &&
      cntx &&
      (cntx = canvas.getContext("2d")) &&
      ((canvas.width = canvas.scrollWidth),
      (canvas.height = canvas.scrollHeight),
      cntx.clearRect(0, 0, canvas.width, canvas.height),
      (cntx.lineWidth = 3),
      (cntx.fillStyle = "none"),
      640 <= sWidth_width
        ? ((_g_x =
            (null == (h_y = document.querySelector(".page-1__value"))
              ? void 0
              : h_y.offsetTop) || 0),
          (p_x = {
            x0: 240,
            y0: canvas.height / 2 - 16,
            x1: canvas.width - 140,
            y1: _g_x + 20,
          }),
          (h_x = {
            x0: 240,
            y0: canvas.height / 2 + 16,
            x1: canvas.width - 140,
            y1: canvas.height - _g_x - 20,
          }),
          (cntx.strokeStyle = "#ff0000"),
          cntx.beginPath(),
          cntx.moveTo(240, canvas.height / 2),
          cntx.lineTo(canvas.width - 140, canvas.height / 2),
          cntx.stroke(),
          (cntx.strokeStyle = "#aaa"),
          cntx.beginPath(),
          cntx.moveTo(p_x.x0, p_x.y0),
          cntx.lineTo(p_x.x1, p_x.y1),
          cntx.moveTo(h_x.x0, h_x.y0),
          cntx.lineTo(h_x.x1, h_x.y1),
          cntx.stroke(),
          (cntx.lineWidth = 2),
          cntx.moveTo(canvas.width - 70, _g_x + 40),
          cntx.lineTo(canvas.width - 70, canvas.height / 2 - 30),
          cntx.moveTo(canvas.width - 70, canvas.height - _g_x - 40),
          cntx.lineTo(canvas.width - 70, canvas.height / 2 + 30),
          cntx.stroke(),
          (_c = Math.atan((p_x.y1 - p_x.y0) / (p_x.x1 - p_x.x0))),
          (_g_y = Math.atan((h_x.y1 - h_x.y0) / (h_x.x1 - h_x.x0))),
          (p_y = Math.PI / 2),
          (_r = 5 * Math.cos(p_y - _c)),
          (_i = 5 * Math.sin(p_y - _c)),
          (d_x = 5 * Math.cos(_c) * 1.5),
          (d_y = 5 * Math.sin(_c) * 1.5),
          (h_y = 5 * Math.cos(p_y - _g_y)),
          (_g_x = 5 * Math.sin(p_y - _g_y)),
          (_c = 5 * Math.cos(_g_y) * 1.5),
          (p_y = 5 * Math.sin(_g_y) * 1.5),
          (cntx.fillStyle = "#ff0000"),
          cntx.beginPath(),
          cntx.moveTo(canvas.width - 140, canvas.height / 2 - 5),
          cntx.lineTo(canvas.width - 140, canvas.height / 2 + 5),
          cntx.lineTo(canvas.width - 140 + 7.5, canvas.height / 2),
          cntx.lineTo(canvas.width - 140, canvas.height / 2 - 5),
          cntx.fill(),
          (cntx.fillStyle = "#aaa"),
          cntx.beginPath(),
          cntx.moveTo(p_x.x1 - _r, p_x.y1 + _i),
          cntx.lineTo(p_x.x1 + _r, p_x.y1 - _i),
          cntx.lineTo(p_x.x1 + d_x, p_x.y1 + d_y),
          cntx.lineTo(p_x.x1 - _r, p_x.y1 + _i),
          cntx.fill(),
          cntx.beginPath(),
          cntx.moveTo(h_x.x1 - h_y, h_x.y1 + _g_x),
          cntx.lineTo(h_x.x1 + h_y, h_x.y1 - _g_x),
          cntx.lineTo(h_x.x1 + _c, h_x.y1 + p_y),
          cntx.lineTo(h_x.x1 - h_y, h_x.y1 + _g_x))
        : ((_g_y = document.querySelector(".page-1__price")),
          (d_x = document.querySelector(".page-1__gain")),
          (d_y = _g_y.offsetTop + _g_y.clientHeight + 20),
          (_r = d_x.offsetTop - 20),
          (p_x = d_x.offsetTop + d_x.clientHeight / 2),
          (_i = { x0: canvas.width / 2 - 20, y0: d_y, x1: 80, y1: _r }),
          (_c = {
            x0: canvas.width / 2 + 20,
            y0: d_y,
            x1: canvas.width - 80,
            y1: _r,
          }),
          (cntx.strokeStyle = "#ff0000"),
          cntx.beginPath(),
          cntx.moveTo(canvas.width / 2, d_y),
          cntx.lineTo(canvas.width / 2, _r),
          cntx.stroke(),
          (cntx.strokeStyle = "#aaa"),
          cntx.beginPath(),
          cntx.moveTo(_i.x0, _i.y0),
          cntx.lineTo(_i.x1, _i.y1),
          cntx.moveTo(_c.x0, _c.y0),
          cntx.lineTo(_c.x1, _c.y1),
          cntx.moveTo(120, p_x),
          cntx.lineTo(canvas.width / 2 - 60, p_x),
          cntx.moveTo(canvas.width / 2 + 60, p_x),
          cntx.lineTo(canvas.width - 120, p_x),
          cntx.stroke(),
          (p_y = Math.atan((_i.y1 - _i.y0) / (_i.x1 - _i.x0))),
          (h_y = Math.atan((_c.y1 - _c.y0) / (_c.x1 - _c.x0))),
          (h_x = Math.PI / 2),
          (_g_x = 5 * Math.cos(h_x - p_y)),
          (_g_y = 5 * Math.sin(h_x - p_y)),
          (d_x = 5 * Math.cos(p_y) * 1.5),
          (d_y = 5 * Math.sin(p_y) * 1.5),
          (p_x = 5 * Math.cos(h_x - h_y)),
          (p_y = 5 * Math.sin(h_x - h_y)),
          (h_x = 5 * Math.cos(h_y) * 1.5),
          (h_y = 5 * Math.sin(h_y) * 1.5),
          (cntx.fillStyle = "#ff0000"),
          cntx.beginPath(),
          cntx.moveTo(canvas.width / 2 - 5, _r),
          cntx.lineTo(canvas.width / 2 + 5, _r),
          cntx.lineTo(canvas.width / 2, 7.5 + _r),
          cntx.lineTo(canvas.width / 2 - 5, _r),
          cntx.fill(),
          (cntx.fillStyle = "#aaa"),
          cntx.beginPath(),
          cntx.moveTo(_i.x1 - _g_x, _i.y1 + _g_y),
          cntx.lineTo(_i.x1 + _g_x, _i.y1 - _g_y),
          cntx.lineTo(_i.x1 - d_x, _i.y1 - d_y),
          cntx.lineTo(_i.x1 - _g_x, _i.y1 + _g_y),
          cntx.fill(),
          cntx.beginPath(),
          cntx.moveTo(_c.x1 - p_x, _c.y1 + p_y),
          cntx.lineTo(_c.x1 + p_x, _c.y1 - p_y),
          cntx.lineTo(_c.x1 + h_x, _c.y1 + h_y),
          cntx.lineTo(_c.x1 - p_x, _c.y1 + p_y)),
      cntx.fill());
  }
  initCanvas(),
    (function () {
      $(".pn-button").on("click", buttonPress),
        $(".pn-indicator i").on("click", indicatorPress);
      var elements = document.getElementsByClassName("cal-input");
      Array.from(elements).forEach(function (element) {
        element.addEventListener("change", calculateNewValues);
      }),
        $(".cal-input").on("change", function () {
          updateLocalSession($(this).attr("id"), $(this).val());
        }),
        (el("year-reanger").oninput = function () {
          $(".runtimeCOPY").html(this.value),
            (el("runtime").value = this.value),
            1 == parseInt(this.value)
              ? $(".year-txt").html("Jahr")
              : $(".year-txt").html("Jahre"),
            updateLocalSession("runtime", this.value),
            calculateNewValues();
        }),
        window.addEventListener("resize", function () {
          initCanvas();
        }),
        $("input").on("input", function () {
          parseInt($(this).val()) < 0 && $(this).val(0);
        });
    })(),
    (function () {
      var k,
        lData = JSON.parse(localStorage.getItem("dm-real-cal"));
      lData && (localData = lData);
      for (k in localData) $("#" + k).val(localData[k]);
      calculateNewValues();
    })();
})();
