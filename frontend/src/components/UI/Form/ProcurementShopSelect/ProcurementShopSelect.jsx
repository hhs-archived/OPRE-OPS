import { useGetProcurementShopsQuery } from "../../../../api/opsAPI";

/**
 * Object representing a procurement shop.
 * @typedef {Object} selectedProcurementShop - The currently selected procurement shop.
 * @property {string} id - The procurement shop id.
 * @property {number} fee - The procurement shop fee rate.
 * @property {string} name - The procurement shop name.
 * @property {string} abbr - The procurement shop abbreviation.
 */

/**
 * A select input for choosing a procurement shop.
 * @param {Object} props - The component props.
 * @param {selectedProcurementShop} props.selectedProcurementShop - The currently selected procurement shop object.
 * @param {Function} props.onChangeSelectedProcurementShop - A function to call when the selected procurement shop changes.
 * @param {string} [props.legendClassname] - Additional CSS classes to apply to the label/legend (optional).
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const ProcurementShopSelect = ({
    selectedProcurementShop,
    onChangeSelectedProcurementShop,
    legendClassname = "",
    defaultString = "-Select Procurement Shop-",
}) => {
    const {
        data: procurementShops,
        error: errorProcurementShops,
        isLoading: isLoadingProcurementShops,
    } = useGetProcurementShopsQuery();

    // React.useEffect(() => {
    //     if (!defaultToAll && !selectedProcurementShop?.id && procurementShops) {
    //         onChangeSelectedProcurementShop(procurementShops[1]);
    //     }
    // }, [defaultToAll, procurementShops, selectedProcurementShop, onChangeSelectedProcurementShop]);

    if (isLoadingProcurementShops) {
        return <div>Loading...</div>;
    }
    if (errorProcurementShops) {
        return <div>Oops, an error occurred</div>;
    }

    const handleChange = (e) => {
        const procurementShopId = e.target.value;

        const procurementShop = {
            id: procurementShops[procurementShopId - 1].id,
            name: procurementShops[procurementShopId - 1].name,
            fee: procurementShops[procurementShopId - 1].fee,
        };
        onChangeSelectedProcurementShop(procurementShop);
    };

    return (
        <fieldset className="usa-fieldset">
            <label className={`usa-label margin-top-0 ${legendClassname}`} htmlFor="procurement-shop-select">
                Procurement Shop
            </label>
            <div className="display-flex flex-align-center">
                <select
                    className="usa-select margin-top-0 width-fit-content"
                    name="procurement-shop-select"
                    id="procurement-shop-select"
                    onChange={handleChange}
                    value={selectedProcurementShop?.id}
                    required
                >
                    <option value="">{defaultString}</option>
                    {procurementShops.map((shop) => (
                        <option key={shop?.id} value={shop?.id}>
                            {shop?.name} ({shop?.abbr})
                        </option>
                    ))}
                </select>
            </div>
        </fieldset>
    );
};

export default ProcurementShopSelect;
