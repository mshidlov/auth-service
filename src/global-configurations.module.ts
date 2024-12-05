import {Global, Module} from "@nestjs/common";
import {AuthenticationConf} from "./auth/authentication.conf";
import {ConfigModule} from "@nestjs/config";
@Global()
@Module({
    imports: [ ConfigModule ],
    providers: [AuthenticationConf],
    exports: [AuthenticationConf]
})
export class GlobalConfigurationsModule{}