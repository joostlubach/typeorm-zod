import { z } from 'zod'

import * as tzext from './tz'

export const tz = {...z, ...tzext}