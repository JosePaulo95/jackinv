
var App = new Vue({
  el: "#app",
  data() {
    return {
      liga: {
        nome: null
      },
      index_rodada: 0,
      is_dropdown_active: false,
      timeHome: null,
      timeAway: null,
      peso_sob: 0.6,
      peso_old: 0.6
    }
  },
  mounted: function () {
    this.liga.nome = "Primeira Liga de Portugal";
  },
  computed: {

  },
  methods: {
    previsoesGols1(code1, code2, index_rodada) {
      if(index_rodada==0){
        return 0
      }else{
        times = this.timesComputados(index_rodada-1);
        map = this.mapCodeTime(times);
        t1 = map[code1]; 
        t2 = map[code2];
        return this.golsTime1(t1, t2);
      }
    },
    previsoesGols2(code1, code2, index_rodada) {
      if(index_rodada==0){
        return 0
      }else{
        times = this.timesComputados(index_rodada-1);
        map = this.mapCodeTime(times);
        t1 = map[code1]; 
        t2 = map[code2];
        return this.golsTime2(t1, t2);
      }
    },
    //da a classe pelo resultado
    classeResultado(result){
      return result==0?'is-danger':result==0.5?'is-light':'is-success';
    },
    //da a label Lose, Draw, Victory pelo resultado
    labelResultado(result){
      return result==0?'L':result==0.5?'D':'V';
    },
    tableClubs(){
      function compareOrdemAlfabetica(c1, c2) {
        return c1.localeCompare(c2);
      }
      return _distinctCodes().sort(compareOrdemAlfabetica);
    },
    matchesRodada(index_rodada){
      return _matches.rounds[index_rodada].matches;
    },
    getFullHistory(){
      return _matches.rounds;
    },
    switchDropdown(){
      this.is_dropdown_active = !this.is_dropdown_active;
    },
    lastMatches(qtd, hst){
      return hst.slice(Math.max(hst.length - qtd, 0));
    },
    firstSelectedRounds(rodada_max){
      return _matches.rounds.slice(0, rodada_max+1);
    },
    selectRodada(index, dropdown=true){
      this.index_rodada = index;
      if(dropdown){
        this.switchDropdown(); 
      }
    },
    timesComputados(index_rodada = this.index_rodada){
      var codes = _distinctCodes();
      var map_code_hst = this.mapCodeVitoriasDerrotas(codes, index_rodada);
      var map_code_score = this.mapCodeTotalPontos(map_code_hst, codes);
      var map_code_stats = this.mapCodeStats(codes, index_rodada);
      
      var clubs_data = this.sortClubs(map_code_hst, map_code_score, map_code_stats);

      return clubs_data;
    },
    mapCodeVitoriasDerrotas(codes, index_rodada){
      var clubs_hst = {};

      codes.map(function(code){
        clubs_hst[code] = [];
      })

      this.firstSelectedRounds(index_rodada).map(function(round) {
        round.matches.map(function(match) {
          clubs_hst[match.team1.code].push(
            match.score1==match.score2?0.5:match.score1>match.score2?1:0
          );
          clubs_hst[match.team2.code].push(
            match.score2==match.score1?0.5:match.score2>match.score1?1:0
          );
        })
      })

      return clubs_hst;
    },
    mapCodeBTTS(codes, index_rodada){
      var clubs_btts = {};

      codes.map(function(code){
        clubs_btts[code] = [];
      })

      _matches.rounds[index_rodada].matches.map(function(match) {
          btts = match.score1>0 && match.score2>0;

          clubs_btts[match.team1.code] = btts;
          clubs_btts[match.team2.code] = btts;
        })

      return clubs_btts;
    },
    mapCodeTime(times){
      var map = [];

      times.map(function(t) {
        map[t.code] = t
      })

      return map;
    },
    mapCodeTotalPontos(clubs_hst, codes){
      var clubs_score = {};
      codes.map(function(code){
        clubs_score[code] = clubs_hst[code].reduce((a, b) => a + b, 0)
      })
      return clubs_score;
    },
    mapCodeStats(codes, index_rodada){
      var clubs_stats = [];
      var peso_old = this.peso_old;
      var peso_new = 1-peso_old;

      codes.map(function(code){
        clubs_stats[code] = {"atk": 1, "def": 1};
      })

      this.firstSelectedRounds(index_rodada).map(function(round) {
        round.matches.map(function(match) {
          code1 = match.team1.code
          code2 = match.team2.code
          score1 = match.score1;
          score2 = match.score2;

          old_atk1 = clubs_stats[code1].atk;
          old_atk2 = clubs_stats[code2].atk;

          old_def1 = clubs_stats[code1].def;
          old_def2 = clubs_stats[code2].def;

          new_atk1 = score1/old_def2;
          new_atk2 = score2/old_def1;

          new_def1 = score2/old_atk2;
          new_def2 = score1/old_atk1;

          
          clubs_stats[code1].atk = old_atk1-(old_atk1-new_atk1)*peso_new;
          clubs_stats[code2].atk = old_atk2-(old_atk2-new_atk2)*peso_new;

          clubs_stats[code1].def = old_def1-(old_def1-new_def1)*peso_new;
          clubs_stats[code2].def = old_def2-(old_def2-new_def2)*peso_new;
          
          /*
          clubs_stats[code1].atk = old_atk1*peso_old+new_atk1*peso_new;
          clubs_stats[code2].atk = old_atk2*peso_old+new_atk2*peso_new;

          clubs_stats[code1].def = old_def1*peso_old+new_def1*peso_new;
          clubs_stats[code2].def = old_def2*peso_old+new_def2*peso_new;
          */
        })
      })

      return clubs_stats;
    },
    mapCodeCodeAdv(index_rodada){
      var map = [];

      _matches.rounds[index_rodada].matches.map(function(m) {
        map[m.team1.code] = m.team2.code
        map[m.team2.code] = m.team1.code
      })
      return map;
    },
    sortClubs(map_code_hst, map_code_score, map_code_stats) {
      var clubs = [];
      var aux_club = {};

      _clubs.clubs.map(function(club){
        atk = map_code_stats[club.code].atk;
        def = map_code_stats[club.code].def;
        atk_ = Math.round(atk*100)/100;
        def_ = Math.round(def*100)/100;

        clubs.push({
          "name": club.name,
          "code": club.code,
          "hst": map_code_hst[club.code],
          "score": map_code_score[club.code],
          "atk": atk,
          "def": def,
          "atk_": atk_,
          "def_": def_
        });
      })

      function compareScore(c1, c2) {
        if (c1.score < c2.score)
          return 1;
        if (c1.score > c2.score)
          return -1;
        return 0;
      }

      return clubs.sort(compareScore);
    },
    previsoesRodadaClub(index_rodada){
      function compareOrdemAlfabetica(t1, t2) {
        return t1.code.localeCompare(t2.code);
      }
      var times = this.timesComputados(index_rodada).sort(compareOrdemAlfabetica);
      var map_code_time = this.mapCodeTime(times);
      var map_code_code_adv = this.mapCodeCodeAdv(index_rodada);
      var map_code_btts = this.mapCodeBTTS(this.tableClubs(), index_rodada);
      var previsao_next_rodada = null;
      var previsoes = [];

      times.map(function(t){
        time_adv = map_code_time[map_code_code_adv[t.code]];
        previsao_gols = this.previsaoJogo(t, time_adv);
        previsao_btts = previsao_gols.gols1>0 && previsao_gols.gols2>0;
        previsao_acertou = map_code_btts[t.code]//previsao==

        previsoes.push(
          [
            {
              "mercado": "btts",
              "status": index_rodada==0?"is-light":previsao_acertou?"is-success":"is-danger",
              "code1": t.code,
              "code2": time_adv.code,
              "golsTime1": 2,
              "golsTime2": 1
            }
          ]
        );
      }.bind(this))

      return previsoes;
    },
    previsaoJogo(t1, t2){
        var gols_t1 = this.golsTime1(t1, t2);
        var gols_t2 = this.golsTime2(t1, t2);
        //>0 && gols_t2>0;
        return {gols1: gols_t1, gols2: gols_t2}
    },
    simularMatchByCodes(code_time_1, code_time_2, index_rodada){
      this.selectRodada(index_rodada-1, false);
      var times = this.timesComputados();

      var map_code_time = this.mapCodeTime(times);
      var t1 = map_code_time[code_time_1];
      var t2 = map_code_time[code_time_2];

      this.selecionarHome(t1);
      this.selecionarAway(t2);
      this.selectRodada(index_rodada, false);
    },
    selecionarHome(time){
      this.timeHome = time;
    },
    selecionarAway(time){
      this.timeAway = time;
    },
    golsHome(mostrar_casas_decimais=false){
      return this.golsTime1(this.timeHome, this.timeAway, mostrar_casas_decimais)
    },
    golsAway(mostrar_casas_decimais=false){
      return this.golsTime2(this.timeHome, this.timeAway, mostrar_casas_decimais)
    },
    ambasMarcam(){
      return this.golsAway()>0 && this.golsHome()>0;
    },
    golsTime1(t1, t2, mostrar_casas_decimais=false){
      var peso_sob = this.peso_sob;
      var impactoatk2atk1 = (t1.atk-t2.atk)*peso_sob;
      var gols_t1 = (t1.atk*t2.def)+impactoatk2atk1;

      if(mostrar_casas_decimais){
        return (Math.round(gols_t1))/100
      }else{
        return Math.round(gols_t1)
      }
    },
    golsTime2(t1, t2, mostrar_casas_decimais=false){
      var peso_sob = this.peso_sob;
      var impactoatk1atk2 = (t2.atk-t1.atk)*peso_sob;
      var gols_t2 = (t2.atk*t1.def)+impactoatk1atk2;

      if(mostrar_casas_decimais){
        return (Math.round(gols_t2))/100
      }else{
        return Math.round(gols_t2)
      }
    },
  }
});
