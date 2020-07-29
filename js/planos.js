var App = new Vue({
  el: "#app",
  data() {
    return {
      isCreationMenuVisible: false,
      creationMenuValorInicial: null,
      creationMenuValorRendimento: null,
      creationMenuTipoRendimentoSelecionado: null,
      creationMenuValorTitulo: "",
      tabelaTiposRendimento:[
        {"code": "ad", "label": "% a.d.", "labelDetalhada": "% ao dia", "datas_intervalo": []},
        {"code": "am", "label": "% a.m.", "labelDetalhada": "% ao mês", "datas_intervalo": []},
        {"code": "aa", "label": "% a.a.", "labelDetalhada": "% ao ano", "datas_intervalo": []},
        {"code": "ad-fds", "label": "% a.d. (excluindo fds)", "labelDetalhada": "% ao dia (parando nos fds)", "datas_intervalo": []}
      ],
      tipsValoresIniciais:[1500, 3000, 5000],
      tipsRendimentos:[1,3,5],
      planos:[],
      todas_datas_intervalo: [],
      eixo_x: {
        data_limite: null,
        range_selecionado: 100,
        qtde_steps: null,
        indexes: []
      },
      opts_intervalo:[
        {"code": "intv-1sem","label": "1 semana", "is_selected": false, "datas_intervalo": [], "labels": []},
        {"code": "intv-1mes","label": "1 mês", "is_selected": false, "datas_intervalo": [], "labels": []},
        {"code": "intv-3mes","label": "3 meses", "is_selected": true, "datas_intervalo": [], "labels": []},
        {"code": "intv-1ano","label": "1 ano", "is_selected": false, "datas_intervalo": [], "labels": []}
      ],
      myChart:null,
      cores:[
        "rgba(75, 192, 192, @alpha)",
        "rgba(250, 38, 160, @alpha)",
        "rgba(0, 106, 113, @alpha)",
        "rgba(153, 184, 152, @alpha)",
        "rgba(255, 169, 49, @alpha)"
      ],
      visibilidade_planos: [],
      cores_planos: []
    }
  },
  beforeMount(){
      this.resetCreationMenu();
      this.eixo_x.data_limite = moment.utc().add(1, 'year');

      this.cores.sort(function() {
        return .5 - Math.random();
      });

      var data_hoje = new Date();
      var data_limite = this.eixo_x.data_limite;
      this.todas_datas_intervalo =                    this.gerarArrayDatas("todas",  data_hoje, data_limite);
      this.tabelaTiposRendimento[0].datas_intervalo = this.gerarArrayDatas("ad",     data_hoje, data_limite);
      this.tabelaTiposRendimento[1].datas_intervalo = this.gerarArrayDatas("am",     data_hoje, data_limite);
      this.tabelaTiposRendimento[2].datas_intervalo = this.gerarArrayDatas("aa",     data_hoje, data_limite);
      this.tabelaTiposRendimento[3].datas_intervalo = this.gerarArrayDatas("ad-fds", data_hoje, data_limite);

      this.opts_intervalo[0].datas_intervalo = this.gerarArrayDatas("intv-1sem", data_hoje, data_limite);
      this.opts_intervalo[1].datas_intervalo = this.gerarArrayDatas("intv-1mes", data_hoje, data_limite);
      this.opts_intervalo[2].datas_intervalo = this.gerarArrayDatas("intv-3mes", data_hoje, data_limite);
      this.opts_intervalo[3].datas_intervalo = this.gerarArrayDatas("intv-1ano", data_hoje, data_limite);

      this.opts_intervalo[0].labels = this.gerarLabels("intv-1sem");
      this.opts_intervalo[1].labels = this.gerarLabels("intv-1mes");
      this.opts_intervalo[2].labels = this.gerarLabels("intv-3mes");
      this.opts_intervalo[3].labels = this.gerarLabels("intv-1ano");
  },
  mounted(){
    this.atualizarQtdeSteps();

    //test
    this.planos.push(this.auxCriarPlano("plano de rendimento", 1000, 3, "ad-fds"));
    this.ligaDesligaPlanoVisivel(this.planos.length-1);

    //this.planos.unshift(this.auxCriarPlano("bagulho doido", 2500, 0.1, "ad"));

    this.atualizarChart();


  },
  computed: {
    GetQtdeSteps(){
      let qtde = this.atualizarQtdeSteps();
      //this.atualizarChart();  
      return qtde;
    },
    /*GetPlanos(){
      return this.planos.map(function(p) {
        let a = {
          ...p,
          hover: false,
          valor_inicial: currency(p.valor_inicial, {decimal: ','}).format()
        }
        return a;
      })
    }
    */
  },
  methods: {
    atualizarQtdeSteps(){
      this.eixo_x.qtde_steps = this.lerpQtdeSteps();
      return this.eixo_x.qtde_steps;
    },
    lerpQtdeSteps(){
      return Math.round(this.lerp(5, 12, this.eixo_x.range_selecionado/100));
    },    
    atualizarChart(){
      var intervalo_ativo = this.opts_intervalo.find(opt => opt.is_selected === true);
      var datasets = this.gerarDatasets(intervalo_ativo.datas_intervalo);

      this.renderChart(datasets, intervalo_ativo);
    },
    renderChart(datasets, opcao_intervalo) {
      var ctx = document.getElementById("myChart").getContext('2d');

      if(this.myChart != null){
        this.myChart.destroy();
      }

      this.myChart = new Chart(ctx, {
          type: 'line',
          lineTension: 0,
          data: {
              labels: opcao_intervalo.labels,
              datasets: datasets
          },
          options: {
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true,
                  callback: function(value, index, values) {
                      return "R$ "+currency(value, {decimal: ','}).format();
                  }
                }
              }]                
            },
            tooltips: {
              intersect: false,
              callbacks: {
                label: function(tooltipItem, data) {
                  var label = data.datasets[tooltipItem.datasetIndex].label || '';

                  if (label) {
                      label += ': ';
                  }
                  label += "R$ "+currency(tooltipItem.yLabel, {decimal: ','}).format();
                  return label;
                }
              }
            }
          },
      });
    },
    gerarDatasets(labels){
      var datasets = [];

      for (var i = 0; i < this.planos.length; i++) {
        if(this.visibilidade_planos[i]){
          datasets.push({
            label: this.planos[i].nome,
            data: this.dataRendimento(this.planos[i], labels),
            borderColor: this.getCorPlano(i, 1),
            backgroundColor: this.getCorPlano(i, 0.2),
            lineTension: 0
          });
        }
      }
      return datasets;
    },
    gerarLabels(code_intervalo){
      var labels = [];
      var datas = this.opts_intervalo.find(opt => opt.code === code_intervalo).datas_intervalo;

      switch(code_intervalo) {
        case "intv-1sem":
          for (var i = 0; i < datas.length; i++) {
            str = moment(datas[i], "L").format("dddd D");
            labels.push(str);
          }
          break;
        case "intv-1mes":
          for (var i = 0; i < datas.length; i++) {
            str = "semana "+i
            labels.push(str);
          }
          break;
        case "intv-3mes":
          var labels = ["hoje", "em 15 dias", "em 1 mês", "em 1 mês e meio", "em 2 meses", "em 2 meses e meio", "em 3 meses"];
          break;
        case "intv-1ano":
          for (var i = 0; i < datas.length; i++) {
            str = moment(datas[i], "L").format("D[/]MMMM[/]YYYY")
            labels.push(str);
          }
          break;
        default:
      }
      return labels;
    },
    gerarArrayDatas(code_intervalo, data_inicio, data_fim){ 
      var array_datas = [];
      var day_iter = data_inicio;
      var str;

      switch(code_intervalo) {
        case "todas":
          while(day_iter <= data_fim){
            str = moment.utc(day_iter).format("L");
            array_datas.push(str);

            day_iter = moment.utc(day_iter).add(1, 'days');
          }
          str = moment.utc(day_iter).format("L");
          array_datas.push(str);   
          break;
        case "ad":
          while(day_iter <= data_fim){
            day_iter = moment.utc(day_iter).add(1, 'days');
            str = moment.utc(day_iter).format("L");
            array_datas.push(str);
          }
          break;
        case "am":
          while(day_iter <= data_fim){
            day_iter = moment.utc(day_iter).add(1, 'month');
            str = moment.utc(day_iter).format("L");
            array_datas.push(str);
          }
          break;
        case "am+hj":
          while(day_iter <= data_fim){
            str = moment.utc(day_iter).format("L");
            array_datas.push(str);

            day_iter = moment.utc(day_iter).add(1, 'month');
          }
          str = moment.utc(day_iter).format("L");
          array_datas.push(str);
          break;
        case "aa":
          while(day_iter <= data_fim){
            day_iter = moment.utc(day_iter).add(1, 'year');
            str = moment.utc(day_iter).format("L");
            array_datas.push(str);
          }
          break;
        case "ad-fds":
          while(day_iter <= data_fim){
            day_iter = moment.utc(day_iter).add(1, 'days');
            str = moment.utc(day_iter).format("L");

            code_day = moment(str, "L").format("d");

            if(code_day != 0 && code_day != 6){
              array_datas.push(str);
            }
          }
          break;
        case "am-fds":

          while(day_iter <= data_fim){
            day_iter = moment.utc(day_iter).add(1, 'month');
            str = moment.utc(day_iter).format("L");

            code_day = moment(str, "L").format("d");

            if(code_day != 0 && code_day != 6){
              array_datas.push(str);
            }
          }
          break;
        case "intv-1sem":
          data_fim = moment.utc(data_inicio).add(1, 'week');

          while(day_iter <= data_fim){
            str = moment.utc(day_iter).format("L");
            array_datas.push(str);

            day_iter = moment.utc(day_iter).add(1, 'days');
          }
          break;
        case "intv-1mes":
          data_fim = moment.utc(data_inicio).add(1, 'month');

          while(day_iter < data_fim){
            str = moment.utc(day_iter).format("L");
            array_datas.push(str);

            day_iter = moment.utc(day_iter).add(1, 'week');
          }
          
          array_datas.pop();
          str = moment.utc(data_fim).format("L");
          array_datas.push(str);
          
          break;
        case "intv-3mes":
          data_fim = moment.utc(data_inicio).add(3, 'month');

          while(day_iter < data_fim){
            str = moment.utc(day_iter).format("L");
            array_datas.push(str);

            array_datas.push(moment.utc(day_iter).add(15, "days").format("L"));
            day_iter = moment.utc(day_iter).add(1, 'month');
          }
          str = moment.utc(data_fim).format("L");
          array_datas.push(str);
          break;
        case "intv-1ano":
          data_fim = moment.utc(data_inicio).add(1, 'year');
          while(day_iter < data_fim){
            str = moment.utc(day_iter).format("L");
            array_datas.push(str);

            day_iter = moment.utc(day_iter).add(1, 'month');
          }
          str = moment.utc(day_iter).format("L");
          array_datas.push(str);
          break;
        default:
      }

      return array_datas;
    },
    lerp(a, b, f){
        return a + f * (b - a);
    },
    dataRendimento(plano, labels){
      var progressao_valores = [];
      for (var i = 0; i < labels.length; i++) {
        progressao_valores.push(plano.data_rendimento[labels[i]]);
      }

      return progressao_valores;
    },
    currency(v){
      return currency(v, {decimal: ','}).format()
    },
    ligaDesligaCreationMenu(){
      this.isCreationMenuVisible = !this.isCreationMenuVisible;
    },
    resetCreationMenu(){
      this.creationMenuValorTitulo = "";
      this.creationMenuValorInicial = "";
      this.creationMenuValorRendimento = "";
      this.creationMenuTipoRendimentoSelecionado = this.tabelaTiposRendimento[0]//inicializa o form pra ter uma opção pré-selecionada no select
    },
    ligaDesligaPlanoVisivel(index_plano){
      if(this.visibilidade_planos[index_plano]){
        this.visibilidade_planos[index_plano] = false;
        this.cores.push(this.cores_planos[index_plano]);
        this.cores_planos[index_plano] = null;
      }else{
        if(this.cores.length>1){
          this.visibilidade_planos[index_plano] = true;
          this.cores_planos[index_plano] = this.cores.pop();
        }
      }

      this.atualizarChart();
      
      this.planos[index_plano].hover = !this.planos[index_plano].hover;//força atualizar o card
    },
    creationMenuGerarNome(){
      if(this.creationMenuCamposNumericosEstaoPreenchidos()){
        this.creationMenuValorTitulo = 
          "R$ "+
          this.creationMenuValorInicial+" com "+
          this.creationMenuValorRendimento+""+
          this.creationMenuTipoRendimentoSelecionado.labelDetalhada;
      }
    },
    creationMenuValorInicialTip(tipValorInicial){
      this.creationMenuValorInicial = tipValorInicial;
    },
    creationMenuRendimentoTip(tipRendimento){
      this.creationMenuValorRendimento = tipRendimento;
    },
    creationMenuCamposNumericosEstaoPreenchidos(){
        return this.creationMenuValorInicial==null || this.creationMenuValorInicial=="" || 
        this.creationMenuValorRendimento==null || this.creationMenuValorRendimento==""?false:true;
    },
    criarPlano(){
      var form = document.getElementById('menu-creation');

      if(form.checkValidity()){
        var novo_plano = this.auxCriarPlano(
          this.creationMenuValorTitulo,
          this.creationMenuValorInicial,
          this.creationMenuValorRendimento,
          this.creationMenuTipoRendimentoSelecionado.code,
        );
        this.planos.push(novo_plano);//add no começo
        this.ligaDesligaPlanoVisivel(this.planos.length-1);
        this.atualizarChart();
        this.ligaDesligaCreationMenu();
        this.resetCreationMenu();
      }
    },
    auxCriarPlano(nome, valor_inicial, rendimento, code_classe_rendimento){
      var categoria_rendimento = this.tabelaTiposRendimento.find(classe => classe.code === code_classe_rendimento);

      var novo =  {
        nome: nome,
        valor_inicial: parseFloat(valor_inicial),
        rendimento: rendimento,
        categoria_rendimento: categoria_rendimento,
        data_rendimento: this.criarArrayRendimento(valor_inicial, rendimento, categoria_rendimento),
        hover: false,
        is_editing: false
      }
      return novo;
    },
    deletarPlano(plano){
      this.planos.splice(this.planos.indexOf(plano), 1);

      this.atualizarChart();
    },
    planoRendimentoComoSentenca(plano){
      return plano.rendimento+plano.categoria_rendimento.labelDetalhada;
    },
    criarArrayRendimento(valor_inicial, valor_crescimento, classe_rendimento){
      var progressao_valores = [];
      var valor_atual = valor_inicial;

      var next_data_rendimento = classe_rendimento.datas_intervalo[0];
      var j = 0;

      for (var i = 0; i < this.todas_datas_intervalo.length; i++) {
        //incrementa e pula pra proxima data de rendimento
        if(this.todas_datas_intervalo[i] == next_data_rendimento){
          valor_atual = parseFloat(1+(valor_crescimento/100))*valor_atual;
          j++;
          next_data_rendimento = classe_rendimento.datas_intervalo[j];
        }

        progressao_valores[this.todas_datas_intervalo[i]] = valor_atual;
      }

      return progressao_valores;
    },
    getCorPlano(index_plano, alpha){
      var cor = this.cores_planos[index_plano];
      if(cor){
        cor = cor.replace("@alpha", alpha);
        return cor;
      }else{
        return null;
      }
    },
    selecionaIntervalo(index){
      var atual_opt = this.opts_intervalo.find(opt => opt.is_selected === true);
      if(atual_opt != null){
        atual_opt.is_selected = false;
      }

      this.opts_intervalo[index].is_selected = true;

      this.atualizarChart();
    },

  }
});

/*
var labels = [];
      var qtde_datas = this.todas_datas_intervalo.length;
      var qtde_steps = 12;//this.eixo_x.qtde_steps;
      for (var i = 0; i < qtde_steps; i++) {
        //labels são os pontos no eixo X do gráfico
        //aqui ele toma todas as datas do intervalo por exemplo, hj, amanhã, dps, até hj do ano q vem
        //e faz um lerp incluindo o 1o e o último dia pra popular as labels
        labels.push(
          this.todas_datas_intervalo[
            Math.round(this.lerp(
              0,
              qtde_datas-1,
              i/(qtde_steps-1)
            ))
          ]
        );
       } 
      return labels;
*/