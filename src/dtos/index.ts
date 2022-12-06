export * from './generic.dto';
export * from './credentials-token.dto';

// The following comments are useful for swagger parsing
/**
 * page of data
 * @template T
 * @typedef {object} Page<T>
 * @property {number} page.required - The page's number (0 based number)
 * @property {number} size.required - The size of each page
 * @property {object} sortBy.required - Key value pair of sorting instruction ({field1:ASC,field2:DESC,...})
 * @property {number} count.required - The current number of records in result
 * @property {number} totalPages.required - The total number of pages (computed via the current size)
 * @property {number} totalElements.required - The total number of records in database
 * @property {object[]} data.required - The records
 */

/**
 * Sorting instruction
 * Note that when used with query param sorts, it must be in the form ['field1,ASC', 'field2,DESC'...]
 * The URL looks like: https://my-api/endpoint?sorts=field1,ASC&sorts=field2,DESC (note that sorts= is used multiple times to act as an array)
 * @typedef {object} SortQuery
 * @property {string} field.required - Any existing field
 * @property {string} direction - The sorting direction (ascending by default) - enum:ASC,DESC
 */

/**
 * Operator for applying filtering operations
 * Be careful of using correct format compatible with the value type "1" is a string while 1 is a number
 * @typedef {object} FilterOperator
 * @property {string} is - Check if field is provided value (name[is]"A")
 * @property {string} eq - Check if field equals provided value (name[eq]"A")
 * @property {string} lt - Check if field is lesser than provided value name[lt]"B"
 * @property {string} ltEq - Check if field is lesser than or equal to provided value (name[ltEq]"B")
 * @property {string} gt - Check if field is greater than provided value (name[gt]"A")
 * @property {string} gtEq - Check if field is greater than or equal to provided value (name[gtEq]"A")
 * @property {string} like - Check if field is like provided value (name[like]"%A%")
 * @property {string} iLike - Check if field is like provided value (case insensitive) (name[iLike]"Al%")
 * @property {string} bt - Check if field is between the two provided values (name[bt]["A","B"])
 * @property {string} in - Check if field is in list of provided values (name[in]["A","C"])
 * @property {string} any - Check if field is in any of provided values (name[any]["A","D"])
 * @property {string} null - Check if field is null (name[null])
 */

/**
 * Filtering instructions
 * Note that when used with query param filters, it must be in the form  in the form ['field1[operator1]value1', 'field2[operator2]value2'...]
 * Also note that filters is interpreted as a two-dimensional array, as so, it can be used in URL with 0 based number indices
 * The URL looks like: https://my-api/endpoint?filters[0]=field01[operator01]value01&filters[0]=field02[operator02]value02&filters[1]=field11[operator11]value11
 * All filtering instructions in a same level are concatenated with an AND operator, while the operator between different is interpreted as an OR.
 * The previous URL is interpreted as: "Find records with (field01[operator01]value01 AND field02[operator02]value02) OR (field11[operator11]value11)
 * @typedef {object} FilterQuery
 * @property {string} field.required - Any existing field
 * @property {FilterOperator} operator.required - Any existing operator between brackets
 * @property {string} value.required - The value to apply with given operator on provided field
 */
