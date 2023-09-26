use std::convert::TryFrom;

use shared::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = "checkAbi")]
pub fn check_abi(abi: &str) -> Result<(), JsValue> {
    let contract = serde_json::from_str::<ton_abi::contract::SerdeContract>(abi).handle_error()?;
    ton_abi::Contract::try_from(contract).handle_error()?;
    Ok(())
}

#[wasm_bindgen(typescript_custom_section)]
const FUNCTION_ENTRY: &str = r#"
export type FunctionEntry = {
    name: string,
    id: number,
};
"#;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(typescript_type = "FunctionEntry")]
    pub type FunctionEntry;
}

#[wasm_bindgen(js_name = "getContractFunctions")]
pub fn get_contract_functions(abi: &str) -> Result<Vec<FunctionEntry>, JsValue> {
    let contract = serde_json::from_str::<ton_abi::contract::SerdeContract>(abi).handle_error()?;
    let sorted_function_names = contract
        .functions
        .iter()
        .map(|item| item.name.clone())
        .collect::<Vec<_>>();

    let contract = ton_abi::Contract::try_from(contract).handle_error()?;
    let mut result = Vec::with_capacity(sorted_function_names.len());
    for name in sorted_function_names {
        if let Some(function) = contract.functions.get(&name) {
            result.push(
                ObjectBuilder::new()
                    .set("name", name)
                    .set("id", function.input_id)
                    .build()
                    .unchecked_into(),
            );
        }
    }

    Ok(result)
}

#[wasm_bindgen(js_name = "computeTip6InterfaceId")]
pub fn compute_tip6_interface_id(method_ids: &[u32]) -> u32 {
    let mut result = 0;
    for id in method_ids {
        result ^= id;
    }
    result
}
