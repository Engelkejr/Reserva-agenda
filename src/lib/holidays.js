/**
 * Módulo de feriados para o município do Rio de Janeiro.
 *
 * Calcula dinamicamente todos os feriados nacionais, estaduais (RJ),
 * municipais (Rio de Janeiro) e pontos facultativos para qualquer ano.
 *
 * Utiliza a fórmula de Gauss (válida para 1900-2099) para calcular a Páscoa,
 * a partir da qual derivam os feriados móveis.
 */

// ============================================================================
// Utilitários
// ============================================================================

/**
 * Formata um objeto Date como string 'YYYY-MM-DD'.
 * @param {Date} date - Objeto Date a ser formatado.
 * @returns {string} Data no formato 'YYYY-MM-DD'.
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adiciona (ou subtrai) dias a uma data e retorna uma nova instância de Date.
 * @param {Date} date - Data base.
 * @param {number} days - Número de dias a adicionar (negativo para subtrair).
 * @returns {Date} Nova data resultante.
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================================================
// Cálculo da Páscoa — Fórmula de Gauss (1900-2099)
// ============================================================================

/**
 * Calcula a data do Domingo de Páscoa para um determinado ano.
 *
 * Implementa a fórmula de Gauss com as duas exceções documentadas:
 *   1. Se o resultado for 26 de abril, usar 19 de abril.
 *   2. Se o resultado for 25 de abril E d===28 E e===6 E a>10, usar 18 de abril.
 *
 * @param {number} year - Ano (entre 1900 e 2099).
 * @returns {Date} Objeto Date representando o Domingo de Páscoa.
 */
export function calculateEaster(year) {
  const a = year % 19;
  const b = year % 4;
  const c = year % 7;
  const d = (19 * a + 24) % 30;
  const e = (2 * b + 4 * c + 6 * d + 5) % 7;

  let day = 22 + d + e; // dia em março
  let month = 2; // índice 0-based: março = 2

  // Se ultrapassar 31 de março, converter para abril
  if (day > 31) {
    day = d + e - 9;
    month = 3; // abril = 3

    // Exceção 1: resultado 26 de abril → usar 19 de abril
    if (day === 26) {
      day = 19;
    }

    // Exceção 2: resultado 25 de abril com condições específicas → usar 18 de abril
    if (day === 25 && d === 28 && e === 6 && a > 10) {
      day = 18;
    }
  }

  return new Date(year, month, day);
}

// ============================================================================
// Geração da lista de feriados
// ============================================================================

/**
 * Retorna todos os feriados do município do Rio de Janeiro para um ano.
 *
 * Inclui feriados nacionais, estaduais (RJ), municipais (Rio de Janeiro)
 * e pontos facultativos derivados do Carnaval e Corpus Christi.
 *
 * @param {number} year - Ano desejado.
 * @returns {Array<{date: string, name: string, type: string}>}
 *   Lista de objetos com date ('YYYY-MM-DD'), name e type.
 */
export function getHolidaysForYear(year) {
  const easter = calculateEaster(year);

  // --------------------------------------------------
  // Feriados fixos
  // --------------------------------------------------
  const fixedHolidays = [
    { date: `${year}-01-01`, name: 'Confraternização Universal',     type: 'nacional'   },
    { date: `${year}-01-20`, name: 'Dia de São Sebastião',           type: 'municipal'   },
    { date: `${year}-04-21`, name: 'Tiradentes',                     type: 'nacional'    },
    { date: `${year}-04-23`, name: 'Dia de São Jorge',               type: 'estadual'    },
    { date: `${year}-05-01`, name: 'Dia do Trabalho',                type: 'nacional'    },
    { date: `${year}-09-07`, name: 'Independência do Brasil',        type: 'nacional'    },
    { date: `${year}-10-12`, name: 'Nossa Senhora Aparecida',        type: 'nacional'    },
    { date: `${year}-11-02`, name: 'Finados',                        type: 'nacional'    },
    { date: `${year}-11-15`, name: 'Proclamação da República',       type: 'nacional'    },
    { date: `${year}-11-20`, name: 'Dia da Consciência Negra',       type: 'nacional'    },
    { date: `${year}-12-25`, name: 'Natal',                          type: 'nacional'    },
  ];

  // --------------------------------------------------
  // Feriados móveis (relativos à Páscoa)
  // --------------------------------------------------
  const movableHolidays = [
    { date: formatDate(addDays(easter, -48)), name: 'Segunda de Carnaval',    type: 'facultativo' },
    { date: formatDate(addDays(easter, -47)), name: 'Terça de Carnaval',      type: 'estadual'    },
    { date: formatDate(addDays(easter, -46)), name: 'Quarta-feira de Cinzas', type: 'facultativo' },
    { date: formatDate(addDays(easter, -2)),  name: 'Sexta-Feira Santa',      type: 'nacional'    },
    { date: formatDate(addDays(easter, 60)),  name: 'Corpus Christi',         type: 'facultativo' },
  ];

  // Combinar e ordenar por data
  const allHolidays = [...fixedHolidays, ...movableHolidays];
  allHolidays.sort((a, b) => a.date.localeCompare(b.date));

  return allHolidays;
}

// ============================================================================
// Verificação de feriado
// ============================================================================

/**
 * Verifica se uma data é feriado no município do Rio de Janeiro.
 *
 * @param {string} dateStr - Data no formato 'YYYY-MM-DD'.
 * @returns {{date: string, name: string, type: string} | null}
 *   Objeto do feriado encontrado ou null se não for feriado.
 */
export function isHoliday(dateStr) {
  const year = parseInt(dateStr.substring(0, 4), 10);
  const holidays = getHolidaysForYear(year);
  return holidays.find((h) => h.date === dateStr) || null;
}
