export const Translations: Object = {
    'en': {
        'PPTX': {
            'TITLE_INTRO': () => 'UNDERSTANDING EVICTION IN',
            'TITLE_SOURCE': () => 'A PowerPoint Presentation generated by The Eviction Lab at Princeton University',
            'TITLE_EXTRACT_DATE': () => `Data extracted on ${new Date().toISOString().slice(0, 10)}`,
            'TITLE_WEB_LINK': () => 'For further information, visit www.evictionlab.org',
            'UNAVAILABLE': () => 'Unavailable',
            'EVICTION': () => 'Eviction',
            'EVICTION_FILING': () => 'Eviction Filing',
            'EVICTION_RATE': () => 'Eviction Rate',
            'EVICTION_FILING_RATE': () => 'Eviction Filing Rate',
            'EVICTIONS_PER_DAY': () => 'Evictions Per Day',
            'FEATURE_TITLE': (name, total, year) => `${name} experienced ${total} evictions in ${year}`,
            'FEATURE_TITLE_UNAVAILABLE': (name, year) => `${year} eviction data for ${name} is unavailable`,
            'FEATURE_BULLET_ONE': (total) => `Number of evictions per day: ${total}`,
            'FEATURE_BULLET_TWO': (rate) => `Overall eviction rate: ${rate}*`,
            'FEATURE_RATE_DESCRIPTION': () => '* An eviction rate is the number of evictions per 100 renter-occupied households',
            'RACE_ETHNICITY': () => 'Race/Ethnicity',
            'BAR_CHART_TITLE': (subject, year) => `Comparison of ${subject} rates in ${year}`,
            'LINE_CHART_TITLE': (subject) => `Comparison of ${subject} rates over time`
        },
        'DATA_PROPS': {
            'e': 'Total Evictions',
            'p': 'Population',
            'pro': '% Renter-Occupied Households',
            'pr': 'Poverty Rate',
            'mgr': 'Median Gross Rent',
            'mhi': 'Median Household Income',
            'mpv': 'Median Property Value'
        },
        'DEM_DATA_PROPS': {
            'paa': 'Black',
            'pw': 'White',
            'ph': 'Hispanic/Latinx',
            'pa': 'Asian',
            'pai': 'American Indian/Alaska Native',
            'pnp': 'Native Hawaiian/Pacific Islander',
            'pm': 'Multiple Races',
            'po': 'Other Races'
        }
    },
    'es': {
        'PPTX': {
            'TITLE_INTRO': () => 'UNDERSTANDING EVICTION IN',
            'TITLE_SOURCE': () => 'A PowerPoint Presentation generated by The Eviction Lab at Princeton University',
            'TITLE_EXTRACT_DATE': () => `Data extracted on ${new Date().toISOString().slice(0, 10)}`,
            'TITLE_WEB_LINK': () => 'For further information, visit www.evictionlab.org',
            'UNAVAILABLE': () => 'Unavailable',
            'EVICTION': () => 'Eviction',
            'EVICTION_FILING': () => 'Eviction Filing',
            'EVICTION_RATE': () => 'Eviction Rate',
            'EVICTION_FILING_RATE': () => 'Eviction Filing Rate',
            'EVICTIONS_PER_DAY': () => 'Desalojos por Día',
            'FEATURE_TITLE': (name, total, year) => `${name} experienced ${total} evictions in ${year}`,
            'FEATURE_TITLE_UNAVAILABLE': (name, year) => `${year} eviction data for ${name} is unavailable`,
            'FEATURE_BULLET_ONE': (total) => `Number of evictions per day: ${total}`,
            'FEATURE_BULLET_TWO': (rate) => `Overall eviction rate: ${rate}*`,
            'FEATURE_RATE_DESCRIPTION': () => '* An eviction rate is the number of evictions per 100 renter-occupied households',
            'RACE_ETHNICITY': () => 'Race/Ethnicity',
            'BAR_CHART_TITLE': (subject, year) => `Comparison of ${subject} rates in ${year}`,
            'LINE_CHART_TITLE': (subject) => `Comparison of ${subject} rates over time`
        },
        'DATA_PROPS': {
            'e': 'Total Evictions',
            'p': 'Población',
            'pro': '% Casas Ocupadas por Inquilinos',
            'pr': 'Tasa de Pobreza',
            'mgr': 'Renta Bruta Mediana',
            'mhi': 'Ingreso Bruto Mediano',
            'mpv': 'Valor de Propiedad Mediano'
        },
        'DEM_DATA_PROPS': {
            'paa': 'Negro',
            'pw': 'Blanco',
            'ph': 'Hispánico',
            'pa': 'Asiático',
            'pai': 'Indígena/Nativo de Alaska',
            'pnp': 'Nativo de Hawaii/Isleños del Pacífico',
            'pm': 'Dos o Más Razas',
            'po': 'Otra Raza'
        }
    }
};
