import { login, logout } from "./authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationContext from "../../applicationContext/ApplicationContext";
import cryptoRandomString from "crypto-random-string";
import { getAuthorizationCode } from "./auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { solid } from "@fortawesome/fontawesome-svg-core/import.macro";

const AuthSection = () => {
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const callBackend = useCallback(
        async (authCode) => {
            const response = await ApplicationContext.get().helpers().callBackend(`api/v1/auth/login/`, "post", {
                callbackUrl: window.location.href,
                code: authCode,
            });

            localStorage.setItem("jwt", response.jwt);
            console.log({ jwt: response.jwt });

            dispatch(login());

            navigate("/");
        },
        [dispatch, navigate]
    );

    useEffect(() => {
        const currentJWT = localStorage.getItem("jwt");

        if (currentJWT) {
            // TODO: we should validate the JWT here and set it on state if valid else logout
            dispatch(login());
            return;
        }

        const localStateString = localStorage.getItem("ops-state-key");

        if (localStateString) {
            const queryParams = new URLSearchParams(window.location.search);

            // check if we have been redirected here from the OIDC provider
            if (queryParams.has("state") && queryParams.has("code")) {
                // check that the state matches
                const returnedState = queryParams.get("state");
                const localStateString = localStorage.getItem("ops-state-key");

                localStorage.removeItem("ops-state-key");

                if (localStateString !== returnedState) {
                    throw new Error("Response from OIDC provider is invalid.");
                } else {
                    const authCode = queryParams.get("code");
                    console.log(`Received Authentication Code = ${authCode}`);
                    callBackend(authCode).catch(console.error);
                }
            }
        } else {
            // first page load - generate state token and set on localStorage
            localStorage.setItem("ops-state-key", cryptoRandomString({ length: 64 }));
        }
    }, [callBackend, dispatch]);

    const logoutHandler = () => {
        dispatch(logout());
        localStorage.removeItem("jwt");
    };

    return (
        <div>
            {!isLoggedIn && (
                <div>
                    <button
                        className="usa-button fa-solid fa-arrow-right-to-bracket margin-1"
                        onClick={() =>
                            (window.location.href = getAuthorizationCode(localStorage.getItem("ops-state-key")))
                        }
                    >
                        <span className="margin-1">Sign-in</span>
                        <FontAwesomeIcon icon={solid("arrow-right-to-bracket")} />
                    </button>
                </div>
            )}
            {isLoggedIn && (
                <div>
                    <button className="usa-button fa-solid fa-arrow-right-to-bracket margin-1" onClick={logoutHandler}>
                        <span className="margin-1">Sign-out</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuthSection;
